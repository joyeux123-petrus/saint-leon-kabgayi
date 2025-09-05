const db = require('../db');

exports.getDashboardStats = async (req, res) => {
  try {
    // Assuming the user is a teacher and we want stats relevant to them
    const teacherId = req.user.id; 

    // Number of quizzes created by this teacher
    const [quizzesCreatedResult] = await db.promise().query('SELECT COUNT(*) as count FROM quizzes WHERE created_by = ?', [teacherId]);
    const quizzesCreated = quizzesCreatedResult[0].count;

    // Number of classes managed by this teacher (assuming teacherClass in users table)
    const [teacherClassResult] = await db.promise().query('SELECT teacherClass FROM users WHERE id = ?', [teacherId]);
    const teacherClass = teacherClassResult[0]?.teacherClass;
    let classesManaged = 0;
    if (teacherClass) {
      classesManaged = 1; // Simple count, could be more complex if a teacher manages multiple distinct classes
    }

    // Number of students enrolled in their classes (this is a simplification)
    // This would ideally involve joining users with classes taught by the teacher
    const [studentsEnrolledResult] = await db.promise().query('SELECT COUNT(*) as count FROM users WHERE role = ? AND className = ?', ['student', teacherClass]);
    const studentsEnrolled = studentsEnrolledResult[0].count;

    // Placeholder for events organized (needs an events table and logic)
    const eventsOrganized = 0; 

    res.status(200).json({
      quizzesCreated,
      classesManaged,
      studentsEnrolled,
      eventsOrganized
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};