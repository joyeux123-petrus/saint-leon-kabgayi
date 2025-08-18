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
