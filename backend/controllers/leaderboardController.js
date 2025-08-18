const db = require('../models/db');

exports.getLeaderboard = async (req, res) => {
  try {
    const [leaderboard] = await db.query('SELECT l.id, l.class, u.name, l.badge FROM leaderboard l JOIN users u ON l.user_id = u.id ORDER BY l.score DESC LIMIT 10');
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
};
