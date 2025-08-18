const db = require('../models/db');

exports.listAnnouncements = async (req, res) => {
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

