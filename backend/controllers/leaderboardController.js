const db = require('../models/db');

exports.getLeaderboard = async (req, res) => {
  try {
    const [leaderboard] = await db.query('SELECT l.id, l.class, u.name, l.badge FROM leaderboard l JOIN users u ON l.user_id = u.id ORDER BY l.score DESC LIMIT 10');
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
};

exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    // Example query, adjust as needed
    const [leaderboard] = await db.query('SELECT l.id, l.class, u.name, l.badge FROM leaderboard l JOIN users u ON l.user_id = u.id WHERE WEEK(l.date) = WEEK(CURDATE()) ORDER BY l.score DESC LIMIT 10');
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly leaderboard.' });
  }
};

exports.getMonthlyLeaderboard = async (req, res) => {
  try {
    // Example query, adjust as needed
    const [leaderboard] = await db.query('SELECT l.id, l.class, u.name, l.badge FROM leaderboard l JOIN users u ON l.user_id = u.id WHERE MONTH(l.date) = MONTH(CURDATE()) ORDER BY l.score DESC LIMIT 10');
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly leaderboard.' });
  }
};

exports.getUserRank = async (req, res) => {
  try {
    const { userId } = req.params;
    // Example query, adjust as needed
    const [rows] = await db.query('SELECT * FROM leaderboard WHERE user_id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found in leaderboard.' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user rank.' });
  }
};
