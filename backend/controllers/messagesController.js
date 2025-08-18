const db = require('../models/db');

exports.listMessages = async (req, res) => {
  try {
    const [messages] = await db.query('SELECT id, text FROM messages ORDER BY created_at DESC LIMIT 10');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};
