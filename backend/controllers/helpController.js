const db = require('../db');

exports.listHelp = async (req, res) => {
  try {
    const [help] = await db.query('SELECT id, text FROM help ORDER BY created_at DESC LIMIT 10');
    res.json({ help });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch help info.' });
  }
};
