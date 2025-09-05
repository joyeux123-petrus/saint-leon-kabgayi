const db = require('../db');

exports.getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Quizzes Completed
    const [quizzesCompletedResult] = await db.promise().query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = ? AND is_completed = TRUE',
      [studentId]
    );
    const quizzesCompleted = quizzesCompletedResult[0].count;

    // Average Score
    const [averageScoreResult] = await db.promise().query(
      'SELECT AVG(score) as avg_score FROM quiz_attempts WHERE student_id = ? AND is_completed = TRUE',
      [studentId]
    );
    const averageScore = averageScoreResult[0].avg_score ? parseFloat(averageScoreResult[0].avg_score).toFixed(2) : 0;

    // Badges Earned (Placeholder - assuming a badges table/logic would be needed)
    const badgesEarned = 0; 

    // Overall Rank (Placeholder - more complex to calculate without a global ranking system)
    const overallRank = 'N/A';

    res.status(200).json({
      quizzesCompleted,
      averageScore,
      badgesEarned,
      overallRank
    });
  } catch (error) {
    console.error('Error fetching student dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching student dashboard stats' });
  }
};

exports.getStudentSubjects = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming JWT auth middleware sets req.user
const [subjects] = await db.promise().query(
      `SELECT s.subject_id, s.name AS subject_name
       FROM users u
       JOIN class_subjects cs ON u.class_id = cs.class_id
       JOIN subjects s ON cs.subject_id = s.subject_id
       WHERE u.id = ?`,
      [studentId]
    );

    res.json(subjects); // Returns array of subjects
  } catch (err) {
    console.error("Error fetching student subjects:", err);
    res.status(500).json({ error: "Failed to fetch subjects." });
  }
};