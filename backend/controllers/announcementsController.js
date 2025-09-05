const connectToDatabase = require('../db.js');

const getAllAnnouncements = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const [announcements] = await db.query('SELECT announcement_id AS id, title, message AS content, date_created AS created_at FROM announcements ORDER BY date_created DESC');
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements.', details: err.message });
  }
};

const createAnnouncement = async (req, res) => {
    const db = await connectToDatabase();
    const { title, content } = req.body;
    try {
        await db.query('INSERT INTO announcements (title, message) VALUES (?, ?)', [title, content]);
        res.status(201).json({ message: 'Announcement created successfully.' });
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ error: 'Failed to create announcement.' });
    }
};

const getAnnouncementById = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT announcement_id AS id, title, message AS content, date_created AS created_at FROM announcements WHERE announcement_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcement.' });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    await db.query('UPDATE announcements SET title=?, message=? WHERE announcement_id=?', [title, content, id]);
    res.json({ message: 'Announcement updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { id } = req.params;
    await db.query('DELETE FROM announcements WHERE announcement_id = ?', [id]);
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
};

module.exports = {
    getAllAnnouncements,
    createAnnouncement,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement
}