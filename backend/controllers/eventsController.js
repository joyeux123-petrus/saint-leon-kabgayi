const db = require('../models/db');

exports.getAllEvents = async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT id, title, description, date, venue FROM events WHERE date >= CURDATE()';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY date ASC';
    const [events] = await db.query(sql, params);
    res.json({ events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
};

exports.createEvent = async (req, res) => {
    const { title, description, date, venue, type } = req.body;
    try {
        await db.query('INSERT INTO events (title, description, date, venue, type) VALUES (?, ?, ?, ?, ?)', [title, description, date, venue, type]);
        res.json({ message: 'Event created successfully.' });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Failed to create event.' });
    }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
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
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, venue, type } = req.body;
    await db.query('UPDATE events SET title=?, description=?, date=?, venue=?, type=? WHERE id=?', [title, description, date, venue, type, id]);
    res.json({ message: 'Event updated successfully.' });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event.' });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
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
exports.registerForEvent = async (req, res) => {
  try {
    // Example: add registration logic here
    res.json({ message: 'Registered for event.' });
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ error: 'Failed to register for event.' });
  }
};
