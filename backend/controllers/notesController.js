

const db = require('../models/db');
const path = require('path');
const fs = require('fs');

// List notes (for students, only published notes, with optional class filter)
exports.getAllNotes = async (req, res) => {
  try {
    const { classId } = req.query;
    let sql = 'SELECT id, title, class_id, attachments FROM notes WHERE published = 1';
    const params = [];

    if (classId) {
      sql += ' AND class_id = ?';
      params.push(classId);
    }

    sql += ' ORDER BY created_at DESC';
    const [notes] = await db.query(sql, params);

    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      class: note.class_id, // Map class_id to class
      url: note.attachments ? `/uploads/${JSON.parse(note.attachments)[0]}` : '#' // Assuming first attachment is the main file
    }));

    res.json({ notes: formattedNotes });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    res.json({ note: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch note.' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, color } = req.body;
    await db.query('UPDATE notes SET title=?, content=?, tags=?, color=? WHERE id=?', [title, content, tags, color, id]);
    res.json({ message: 'Note updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note.' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM notes WHERE id = ?', [id]);
    res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
};

exports.getUserNotes = async (req, res) => {
  try {
    const { userId } = req.params;
    const [notes] = await db.query('SELECT * FROM notes WHERE teacher_id = ?', [userId]);
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user notes.' });
  }
};

// Create a new note (teacher)
exports.createNote = async (req, res) => {
  try {
    const { title, content, tags, color, class: classId } = req.body;
    let attachments = [];
    if (req.files && req.files.attachments) {
      attachments = req.files.attachments.map(f => f.filename);
    }
    await db.query(
      'INSERT INTO notes (teacher_id, class_id, title, content, tags, color, attachments, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, classId, title, content, tags, color, JSON.stringify(attachments), 0] // Default to not published
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ success: false, error: 'Failed to create note.' });
  }
};

// Edit note (teacher)
exports.editNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content, tags, color } = req.body;
    await db.query('UPDATE notes SET title=?, content=?, tags=?, color=? WHERE id=? AND teacher_id=?', [title, content, tags, color, noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error editing note:', err);
    res.status(500).json({ success: false, error: 'Failed to edit note.' });
  }
};

// Delete note (teacher)
exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('DELETE FROM notes WHERE id=? AND teacher_id=?', [noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ success: false, error: 'Failed to delete note.' });
  }
};

// Publish note to students (teacher)
exports.publishNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET published=1 WHERE id=? AND teacher_id=?', [noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error publishing note:', err);
    res.status(500).json({ success: false, error: 'Failed to publish note.' });
  }
};

// Analytics (views, downloads, comments)
exports.incrementViews = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET views=views+1 WHERE id=?', [noteId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error incrementing views:', err);
    res.status(500).json({ success: false });
  }
};
exports.incrementDownloads = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET downloads=downloads+1 WHERE id=?', [noteId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error incrementing downloads:', err);
    res.status(500).json({ success: false });
  }
};
exports.incrementComments = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET comments=comments+1 WHERE id=?', [noteId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error incrementing comments:', err);
    res.status(500).json({ success: false });
  }
};

// Pin note (teacher)
exports.pinNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET pinned=1 WHERE id=? AND teacher_id=?', [noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error pinning note:', err);
    res.status(500).json({ success: false, error: 'Failed to pin note.' });
  }
};

// Archive note (teacher)
exports.archiveNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET archived=1 WHERE id=? AND teacher_id=?', [noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error archiving note:', err);
    res.status(500).json({ success: false, error: 'Failed to archive note.' });
  }
};

// Search notes (teacher)
exports.searchNotes = async (req, res) => {
  try {
    const { keyword, tag, pinned, archived, classId } = req.query;
    let sql = 'SELECT * FROM notes WHERE teacher_id=?';
    let params = [req.user.id];
    if (keyword) { sql += ' AND (title LIKE ? OR content LIKE ?)'; params.push('%'+keyword+'%', '%'+keyword+'%'); }
    if (tag) { sql += ' AND tags LIKE ?'; params.push('%'+tag+'%'); }
    if (pinned) { sql += ' AND pinned=1'; }
    if (archived) { sql += ' AND archived=1'; }
    if (classId) { sql += ' AND class_id=?'; params.push(classId); }
    const [notes] = await db.query(sql, params);
    res.json({ notes });
  } catch (err) {
    console.error('Error searching notes:', err);
    res.status(500).json({ error: 'Failed to search notes.' });
  }
};

// Import book/pdf (teacher)
exports.importBook = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    // Save file info to DB or process as needed
    res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    console.error('Error importing book:', err);
    res.status(500).json({ success: false, error: 'Failed to import book.' });
  }
};

// Edit note
exports.editNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, subject, class: classLevel, tags, content, status } = req.body;
    await db.query('UPDATE notes SET title=?, subject=?, class=?, tags=?, content=?, status=? WHERE id=? AND teacher_id=?', [title, subject, classLevel, tags, content, status, noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to edit note.' });
  }
};

// Delete note
exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('DELETE FROM notes WHERE id=? AND teacher_id=?', [noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete note.' });
  }
};

// Publish note
exports.publishNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET status="published" WHERE id=? AND teacher_id=?', [noteId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to publish note.' });
  }
};

// Analytics (views, downloads, comments)
exports.incrementViews = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET views=views+1 WHERE id=?', [noteId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
exports.incrementDownloads = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET downloads=downloads+1 WHERE id=?', [noteId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
exports.incrementComments = async (req, res) => {
  try {
    const noteId = req.params.id;
    await db.query('UPDATE notes SET comments=comments+1 WHERE id=?', [noteId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
