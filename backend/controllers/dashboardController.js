const db = require('../models/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.query("SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'");
    const [[{ totalTeachers }]] = await db.query("SELECT COUNT(*) AS totalTeachers FROM users WHERE role = 'teacher'");
    const [[{ pendingSignups }]] = await db.query("SELECT COUNT(*) AS pendingSignups FROM users WHERE status = 'pending'");
    const [[{ totalQuizzes }]] = await db.query('SELECT COUNT(*) AS totalQuizzes FROM quizzes');
    const [[{ totalClubs }]] = await db.query('SELECT COUNT(*) AS totalClubs FROM clubs');
    const [[{ upcomingEvents }]] = await db.query("SELECT COUNT(*) AS upcomingEvents FROM events WHERE date > NOW()");

    res.json({ 
        totalStudents,
        totalTeachers,
        pendingSignups,
        totalQuizzes,
        totalClubs,
        upcomingEvents
     });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    // Example: fetch recent activity from database
    const [activity] = await db.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 10');
    res.json({ activity });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent activity.' });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM events WHERE date > NOW() ORDER BY date ASC LIMIT 10');
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming events.' });
  }
};

exports.getPerformanceData = async (req, res) => {
  try {
    // Example: fetch performance data
    const [performance] = await db.query('SELECT * FROM performance_metrics WHERE user_id = ?', [req.user.id]);
    res.json({ performance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch performance data.' });
  }
};
