const db = require('../db');

exports.getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    // Get distinct subjects from quizzes the student has attempted
    const [enrolledCourses] = await db.promise().query(
      'SELECT DISTINCT s.id, s.name FROM subjects s JOIN quizzes q ON s.id = q.subject_id JOIN quiz_attempts qa ON q.id = qa.quiz_id WHERE qa.student_id = ?',
      [studentId]
    );
    res.status(200).json({ courses: enrolledCourses });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses' });
  }
};

exports.getExploreCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    // Get all subjects that the student is NOT enrolled in (based on quiz attempts)
    const [exploreCourses] = await db.promise().query(
      'SELECT s.id, s.name FROM subjects s WHERE s.id NOT IN (SELECT DISTINCT q.subject_id FROM quizzes q JOIN quiz_attempts qa ON q.id = qa.quiz_id WHERE qa.student_id = ?)',
      [studentId]
    );
    res.status(200).json({ courses: exploreCourses });
  } catch (error) {
    console.error('Error fetching courses to explore:', error);
    res.status(500).json({ message: 'Error fetching courses to explore' });
  }
};