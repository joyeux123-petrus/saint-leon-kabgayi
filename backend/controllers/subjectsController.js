

exports.listSubjects = async (req, res) => {
  try {
    const [subjects] = await db.query('SELECT * FROM subjects ORDER BY name');
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from auth middleware
    const [enrolledCourses] = await db.query(
      'SELECT s.id, s.name AS title, uc.progress FROM subjects s JOIN user_courses uc ON s.id = uc.subject_id WHERE uc.user_id = ?',
      [userId]
    );
    res.json({ courses: enrolledCourses });
  } catch (err) {
    console.error('Error fetching enrolled courses:', err);
    res.status(500).json({ error: 'Failed to fetch enrolled courses.' });
  }
};
const db = require('../models/db');

// Admin: Create a new subject for a class
exports.createSubject = async (req, res) => {
  const { name, classId } = req.body;
  if (!name || !classId) return res.status(400).json({ error: 'Name and classId required.' });
  try {
    await db.query('INSERT INTO subjects (name, class_id) VALUES (?, ?)', [name, classId]);
    res.json({ message: 'Subject created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subject.' });
  }
};

// List subjects for a class
exports.listSubjectsByClass = async (req, res) => {
  const classId = req.params.classId;
  try {
    const [subjects] = await db.query('SELECT id, name FROM subjects WHERE class_id = ?', [classId]);
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
};
