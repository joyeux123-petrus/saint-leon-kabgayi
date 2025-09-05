const connectToDatabase = require('../db.js');

const getAcademicSummary = async (req, res) => {
  try {
    // Placeholder data for now. In a real application, these would be fetched from the database.
    const academicSummary = {
      avgQuizScore: 75, // Placeholder
      coursesEnrolled: 3, // Placeholder
      upcomingAssignments: 1, // Placeholder
    };

    res.json(academicSummary);
  } catch (err) {
    console.error('Error fetching academic summary:', err);
    res.status(500).json({ error: 'Failed to fetch academic summary.' });
  }
};

const getUserAcademicSummary = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const userId = req.params.userId;

    // Fetch Average Quiz Score
    const [avgScoreResult] = await db.query(
      'SELECT AVG(score) as avg_score FROM quiz_attempts WHERE student_id = ? AND is_completed = TRUE',
      [userId]
    );
    const avgQuizScore = avgScoreResult[0].avg_score ? parseFloat(avgScoreResult[0].avg_score).toFixed(2) : 0;

    // Fetch Courses Enrolled (counting distinct subjects from quizzes attempted)
    const [coursesEnrolledResult] = await db.query(
      'SELECT COUNT(DISTINCT q.subject_id) as count FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.student_id = ? AND qa.is_completed = TRUE',
      [userId]
    );
    const coursesEnrolled = coursesEnrolledResult[0].count || 0;

    // Upcoming Assignments (still a placeholder as no assignments table is evident)
    const upcomingAssignments = 0; // Placeholder

    const userAcademicSummary = {
      userId: userId,
      avgQuizScore: parseFloat(avgQuizScore),
      coursesEnrolled: coursesEnrolled,
      upcomingAssignments: upcomingAssignments,
    };

    res.json(userAcademicSummary);
  } catch (err) {
    console.error('Error fetching user academic summary:', err);
    res.status(500).json({ error: 'Failed to fetch user academic summary.' });
  }
};

const generateSummary = async (req, res) => {
  try {
    // Placeholder for summary generation logic
    const generatedSummary = {
      message: 'Summary generated successfully',
      summary: {
        avgQuizScore: 80,
        coursesEnrolled: 5,
        upcomingAssignments: 3,
      }
    };

    res.json(generatedSummary);
  } catch (err) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
};

module.exports = {
    getAcademicSummary,
    getUserAcademicSummary,
    generateSummary
}