const connectToDatabase = require('../db.js');

const getAllEvents = async (req, res) => {
  const db = await connectToDatabase();
  try {
    let sql = 'SELECT id, title, description, event_date, created_at FROM events WHERE event_date >= CURDATE()';
    sql += ' ORDER BY event_date ASC';
    const [events] = await db.query(sql);
    res.json({ events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
};

const createEvent = async (req, res) => {
    const db = await connectToDatabase();
    const { title, description, event_date } = req.body;
    try {
        await db.query('INSERT INTO events (title, description, event_date) VALUES (?, ?, ?)', [title, description, event_date]);
        res.json({ message: 'Event created successfully.' });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Failed to create event.' });
    }
};

// Get event by ID
const getEventById = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, title, description, event_date, created_at FROM events WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json({ event: rows[0] });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Failed to fetch event.' });
  }
};

// Update event
const updateEvent = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { id } = req.params;
    const { title, description, event_date } = req.body;
    await db.query('UPDATE events SET title=?, description=?, event_date=? WHERE id=?', [title, description, event_date, id]);
    res.json({ message: 'Event updated successfully.' });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event.' });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { id } = req.params;
    await db.query('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event.' });
  }
};

// Register for event
const registerForEvent = async (req, res) => {
  try {
    // Example: add registration logic here
    res.json({ message: 'Registered for event.' });
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ error: 'Failed to register for event.' });
  }
};

module.exports = {
    getAllEvents,
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    registerForEvent
}