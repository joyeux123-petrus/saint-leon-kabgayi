const db = require('../models/db');

exports.getAllAnnouncements = async (req, res) => {
  try {
    // Assuming 'title' and 'message' columns exist in the 'announcements' table
    const [announcements] = await db.query('SELECT id, title, message FROM announcements ORDER BY created_at DESC LIMIT 10');
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
};

exports.createAnnouncement = async (req, res) => {
    const { title, message } = req.body;
    try {
        await db.query('INSERT INTO announcements (title, message) VALUES (?, ?)', [title, message]);
        res.json({ message: 'Announcement created successfully.' });
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ error: 'Failed to create announcement.' });
    }
};

// Get announcement by ID
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    res.json({ announcement: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcement.' });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;
    await db.query('UPDATE announcements SET title=?, message=? WHERE id=?', [title, message, id]);
    res.json({ message: 'Announcement updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
};

