const db = require('../models/db');

exports.listEvents = async (req, res) => {
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
