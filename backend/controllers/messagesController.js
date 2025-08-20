const db = require('../models/db');

exports.getAllMessages = async (req, res) => {
  try {
    const [messages] = await db.query('SELECT id, text FROM messages ORDER BY created_at DESC LIMIT 10');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { text, recipientId } = req.body;
    await db.query('INSERT INTO messages (text, recipient_id, sender_id) VALUES (?, ?, ?)', [text, recipientId, req.user.id]);
    res.json({ message: 'Message sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM messages WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    res.json({ message: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message.' });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    await db.query('UPDATE messages SET text=? WHERE id=?', [text, id]);
    res.json({ message: 'Message updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM messages WHERE id=?', [id]);
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const [messages] = await db.query('SELECT * FROM messages WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?) ORDER BY created_at ASC', [req.user.id, userId, userId, req.user.id]);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation.' });
  }
};
