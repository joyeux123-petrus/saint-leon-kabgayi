const connectToDatabase = require('../db');

// Function to update leaderboard after a quiz attempt
// This function should be called after a quiz attempt is submitted and graded
exports.updateLeaderboard = async (quizId, studentId, score) => {
  const db = await connectToDatabase();
  try {
    // Check if an entry already exists for this student and quiz
    const checkQuery = 'SELECT * FROM leaderboard WHERE quiz_id = ? AND student_id = ?';
    const [result] = await db.query(checkQuery, [quizId, studentId]);

    if (result.length > 0) {
      // Update existing entry if new score is higher
      const existingScore = result[0].score;
      if (score > existingScore) {
        const updateQuery = 'UPDATE leaderboard SET score = ? WHERE quiz_id = ? AND student_id = ?';
        await db.query(updateQuery, [score, quizId, studentId]);
        console.log(`Leaderboard updated for student ${studentId} on quiz ${quizId}`);
      }
    } else {
      // Insert new entry
      const insertQuery = 'INSERT INTO leaderboard (quiz_id, student_id, score) VALUES (?, ?, ?)';
      await db.query(insertQuery, [quizId, studentId, score]);
      console.log(`New leaderboard entry created for student ${studentId} on quiz ${quizId}`);
    }
  } catch (err) {
    console.error('Error updating leaderboard entry:', err);
  }
};

exports.getLeaderboardForQuiz = async (req, res) => {
  const db = await connectToDatabase();
  const { quiz_id } = req.params;
  const query = 'SELECT l.score, u.name as student_name, RANK() OVER (ORDER BY l.score DESC) as rank FROM leaderboard l JOIN users u ON l.student_id = u.id WHERE l.quiz_id = ? ORDER BY l.score DESC';
  try {
    const [results] = await db.query(query, [quiz_id]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching leaderboard for quiz:', err);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};

exports.getStudentRank = async (req, res) => {
  const db = await connectToDatabase();
  const { id } = req.params; // student_id
  const query = `
    SELECT
      l.quiz_id,
      q.title as quiz_title,
      l.score,
      (SELECT COUNT(DISTINCT score) FROM leaderboard WHERE quiz_id = l.quiz_id AND score > l.score) + 1 AS rank
    FROM
      leaderboard l
    JOIN
      quizzes q ON l.quiz_id = q.id
    WHERE
      l.student_id = ?
    ORDER BY
      l.created_at DESC
  `;
  try {
    const [results] = await db.query(query, [id]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching student rank:', err);
    res.status(500).json({ message: 'Error fetching student rank' });
  }
};

exports.getOverallLeaderboard = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const query = `
      SELECT
        u.id as student_id,
        u.name as student_name,
        SUM(qa.score) as total_score,
        COUNT(qa.id) as total_attempts,
        AVG(qa.score) as average_score,
        RANK() OVER (ORDER BY SUM(qa.score) DESC) as rank
      FROM
        quiz_attempts qa
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.is_completed = TRUE
      GROUP BY
        u.id, u.name
      ORDER BY
        total_score DESC
    `;
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    res.status(500).json({ message: 'Error fetching overall leaderboard' });
  }
};

// Generate AI feedback for a student based on their performance
exports.generateAIFeedback = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { studentId } = req.params;
    const uid = req.user?.id || studentId; // Use authenticated user or provided student ID

    // Get student's performance data
    const performanceQuery = `
      SELECT
        u.name as student_name,
        SUM(qa.score) as total_score,
        COUNT(qa.id) as total_attempts,
        AVG(qa.score) as average_score,
        MAX(qa.score) as highest_score,
        MIN(qa.score) as lowest_score,
        COUNT(CASE WHEN qa.score >= 80 THEN 1 END) as excellent_attempts,
        COUNT(CASE WHEN qa.score >= 60 AND qa.score < 80 THEN 1 END) as good_attempts,
        COUNT(CASE WHEN qa.score < 60 THEN 1 END) as needs_improvement_attempts
      FROM
        quiz_attempts qa
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.student_id = ? AND qa.is_completed = TRUE
    `;

    const [performanceData] = await db.query(performanceQuery, [studentId]);

    if (!performanceData || performanceData.length === 0) {
      return res.status(404).json({ message: 'No performance data found for this student' });
    }

    const student = performanceData[0];

    // Get recent quiz attempts for trend analysis
    const recentAttemptsQuery = `
      SELECT
        q.title as quiz_title,
        qa.score,
        qa.created_at,
        s.name as subject_name
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        subjects s ON q.subject_id = s.id
      WHERE
        qa.student_id = ? AND qa.is_completed = TRUE
      ORDER BY
        qa.created_at DESC
      LIMIT 10
    `;

    const [recentAttempts] = await db.query(recentAttemptsQuery, [studentId]);

    // Generate AI feedback prompt
    const prompt = `As an AI tutor, provide personalized feedback for a student based on their academic performance. Here are the details:

Student Name: ${student.student_name}
Total Score: ${student.total_score}
Total Quiz Attempts: ${student.total_attempts}
Average Score: ${student.average_score?.toFixed(1)}%
Highest Score: ${student.highest_score}%
Lowest Score: ${student.lowest_score}%
Excellent Attempts (80%+): ${student.excellent_attempts}
Good Attempts (60-79%): ${student.good_attempts}
Needs Improvement (<60%): ${student.needs_improvement_attempts}

Recent Quiz Attempts:
${recentAttempts.map(attempt => `- ${attempt.quiz_title} (${attempt.subject_name}): ${attempt.score}%`).join('\n')}

Please provide:
1. An encouraging overall assessment
2. Specific strengths to celebrate
3. Areas for improvement with actionable suggestions
4. A motivational message
5. Study tips tailored to their performance pattern

Keep the feedback positive, specific, and actionable. Focus on growth and improvement.`;

    // Call AI service (assuming we have access to the AI service)
    const aiResponse = await generateAIFeedback(prompt);

    res.status(200).json({
      student_name: student.student_name,
      performance_summary: {
        total_score: student.total_score,
        total_attempts: student.total_attempts,
        average_score: student.average_score,
        highest_score: student.highest_score,
        lowest_score: student.lowest_score
      },
      ai_feedback: aiResponse,
      generated_at: new Date()
    });

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    res.status(500).json({ message: 'Error generating AI feedback' });
  }
};

// Helper function to generate AI feedback (placeholder - would integrate with actual AI service)
async function generateAIFeedback(prompt) {
  // This would typically call the AI service
  // For now, return a sample response
  return {
    overall_assessment: "You're making great progress! Your consistent effort is paying off.",
    strengths: [
      "Strong performance in recent quizzes",
      "Good understanding of core concepts",
      "Consistent improvement over time"
    ],
    areas_for_improvement: [
      "Focus on time management during quizzes",
      "Review fundamental concepts regularly",
      "Practice more challenging problems"
    ],
    motivational_message: "Keep up the excellent work! Every quiz is a step toward mastery.",
    study_tips: [
      "Create a study schedule and stick to it",
      "Review mistakes and understand why they happened",
      "Practice with similar problems to build confidence",
      "Take short breaks during study sessions",
      "Join study groups for peer learning"
    ]
  };
}

// Generate motivational message based on performance
exports.generateMotivationalMessage = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { studentId } = req.params;

    // Get student's recent performance
    const recentQuery = `
      SELECT
        AVG(qa.score) as recent_average,
        COUNT(qa.id) as recent_attempts,
        MAX(qa.created_at) as last_attempt_date
      FROM
        quiz_attempts qa
      WHERE
        qa.student_id = ? AND qa.is_completed = TRUE
        AND qa.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

    const [recentData] = await db.query(recentQuery, [studentId]);

    const recentPerformance = recentData[0];
    let messageType = 'encouraging';

    if (recentPerformance.recent_average >= 85) {
      messageType = 'excellent';
    } else if (recentPerformance.recent_average >= 70) {
      messageType = 'good';
    } else if (recentPerformance.recent_average >= 50) {
      messageType = 'improving';
    } else {
      messageType = 'supportive';
    }

    const messages = {
      excellent: [
        "Outstanding work! You're setting the standard for excellence.",
        "Brilliant performance! Keep shining like the star you are.",
        "Exceptional achievement! Your dedication is truly inspiring."
      ],
      good: [
        "Great job! You're on the right track to success.",
        "Well done! Your hard work is paying off beautifully.",
        "Excellent progress! Keep building on your strengths."
      ],
      encouraging: [
        "You're making steady progress! Every step counts.",
        "Good effort! Remember that growth comes from persistence.",
        "Keep going! Your potential is limitless."
      ],
      improving: [
        "You're getting stronger every day! Stay focused on your goals.",
        "Progress takes time, and you're making it! Keep pushing forward.",
        "Every challenge is an opportunity to grow. You've got this!"
      ],
      supportive: [
        "Remember, every expert was once a beginner. You're on your journey!",
        "Learning is a process. Be patient with yourself and keep trying.",
        "Every small step forward is a victory. Celebrate your efforts!"
      ]
    };

    const randomMessage = messages[messageType][Math.floor(Math.random() * messages[messageType].length)];

    res.status(200).json({
      message: randomMessage,
      message_type: messageType,
      performance_context: {
        recent_average: recentPerformance.recent_average,
        recent_attempts: recentPerformance.recent_attempts,
        last_attempt_date: recentPerformance.last_attempt_date
      }
    });

  } catch (error) {
    console.error('Error generating motivational message:', error);
    res.status(500).json({ message: 'Error generating motivational message' });
  }
};

exports.getOverallLeaderboard = async (req, res) => {
  try {
    const query = `
      SELECT
        u.id as student_id,
        u.name as student_name,
        SUM(qa.score) as total_score,
        COUNT(qa.id) as total_attempts,
        AVG(qa.score) as average_score,
        RANK() OVER (ORDER BY SUM(qa.score) DESC) as rank
      FROM
        quiz_attempts qa
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.is_completed = TRUE
      GROUP BY
        u.id, u.name
      ORDER BY
        total_score DESC
    `;
    const [results] = await db.promise().query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    res.status(500).json({ message: 'Error fetching overall leaderboard' });
  }
};

// Generate AI feedback for a student based on their performance
exports.generateAIFeedback = async (req, res) => {
  try {
    const { studentId } = req.params;
    const uid = req.user?.id || studentId; // Use authenticated user or provided student ID

    // Get student's performance data
    const performanceQuery = `
      SELECT
        u.name as student_name,
        SUM(qa.score) as total_score,
        COUNT(qa.id) as total_attempts,
        AVG(qa.score) as average_score,
        MAX(qa.score) as highest_score,
        MIN(qa.score) as lowest_score,
        COUNT(CASE WHEN qa.score >= 80 THEN 1 END) as excellent_attempts,
        COUNT(CASE WHEN qa.score >= 60 AND qa.score < 80 THEN 1 END) as good_attempts,
        COUNT(CASE WHEN qa.score < 60 THEN 1 END) as needs_improvement_attempts
      FROM
        quiz_attempts qa
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.student_id = ? AND qa.is_completed = TRUE
    `;

    const [performanceData] = await db.promise().query(performanceQuery, [studentId]);

    if (!performanceData || performanceData.length === 0) {
      return res.status(404).json({ message: 'No performance data found for this student' });
    }

    const student = performanceData[0];

    // Get recent quiz attempts for trend analysis
    const recentAttemptsQuery = `
      SELECT
        q.title as quiz_title,
        qa.score,
        qa.created_at,
        s.name as subject_name
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        subjects s ON q.subject_id = s.id
      WHERE
        qa.student_id = ? AND qa.is_completed = TRUE
      ORDER BY
        qa.created_at DESC
      LIMIT 10
    `;

    const [recentAttempts] = await db.promise().query(recentAttemptsQuery, [studentId]);

    // Generate AI feedback prompt
    const prompt = `As an AI tutor, provide personalized feedback for a student based on their academic performance. Here are the details:

Student Name: ${student.student_name}
Total Score: ${student.total_score}
Total Quiz Attempts: ${student.total_attempts}
Average Score: ${student.average_score?.toFixed(1)}%
Highest Score: ${student.highest_score}%
Lowest Score: ${student.lowest_score}%
Excellent Attempts (80%+): ${student.excellent_attempts}
Good Attempts (60-79%): ${student.good_attempts}
Needs Improvement (<60%): ${student.needs_improvement_attempts}

Recent Quiz Attempts:
${recentAttempts.map(attempt => `- ${attempt.quiz_title} (${attempt.subject_name}): ${attempt.score}%`).join('\n')}

Please provide:
1. An encouraging overall assessment
2. Specific strengths to celebrate
3. Areas for improvement with actionable suggestions
4. A motivational message
5. Study tips tailored to their performance pattern

Keep the feedback positive, specific, and actionable. Focus on growth and improvement.`;

    // Call AI service (assuming we have access to the AI service)
    const aiResponse = await generateAIFeedback(prompt);

    res.status(200).json({
      student_name: student.student_name,
      performance_summary: {
        total_score: student.total_score,
        total_attempts: student.total_attempts,
        average_score: student.average_score,
        highest_score: student.highest_score,
        lowest_score: student.lowest_score
      },
      ai_feedback: aiResponse,
      generated_at: new Date()
    });

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    res.status(500).json({ message: 'Error generating AI feedback' });
  }
};

// Helper function to generate AI feedback (placeholder - would integrate with actual AI service)
async function generateAIFeedback(prompt) {
  // This would typically call the AI service
  // For now, return a sample response
  return {
    overall_assessment: "You're making great progress! Your consistent effort is paying off.",
    strengths: [
      "Strong performance in recent quizzes",
      "Good understanding of core concepts",
      "Consistent improvement over time"
    ],
    areas_for_improvement: [
      "Focus on time management during quizzes",
      "Review fundamental concepts regularly",
      "Practice more challenging problems"
    ],
    motivational_message: "Keep up the excellent work! Every quiz is a step toward mastery.",
    study_tips: [
      "Create a study schedule and stick to it",
      "Review mistakes and understand why they happened",
      "Practice with similar problems to build confidence",
      "Take short breaks during study sessions",
      "Join study groups for peer learning"
    ]
  };
}

// Generate motivational message based on performance
exports.generateMotivationalMessage = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's recent performance
    const recentQuery = `
      SELECT
        AVG(qa.score) as recent_average,
        COUNT(qa.id) as recent_attempts,
        MAX(qa.created_at) as last_attempt_date
      FROM
        quiz_attempts qa
      WHERE
        qa.student_id = ? AND qa.is_completed = TRUE
        AND qa.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

    const [recentData] = await db.promise().query(recentQuery, [studentId]);

    const recentPerformance = recentData[0];
    let messageType = 'encouraging';

    if (recentPerformance.recent_average >= 85) {
      messageType = 'excellent';
    } else if (recentPerformance.recent_average >= 70) {
      messageType = 'good';
    } else if (recentPerformance.recent_average >= 50) {
      messageType = 'improving';
    } else {
      messageType = 'supportive';
    }

    const messages = {
      excellent: [
        "Outstanding work! You're setting the standard for excellence.",
        "Brilliant performance! Keep shining like the star you are.",
        "Exceptional achievement! Your dedication is truly inspiring."
      ],
      good: [
        "Great job! You're on the right track to success.",
        "Well done! Your hard work is paying off beautifully.",
        "Excellent progress! Keep building on your strengths."
      ],
      encouraging: [
        "You're making steady progress! Every step counts.",
        "Good effort! Remember that growth comes from persistence.",
        "Keep going! Your potential is limitless."
      ],
      improving: [
        "You're getting stronger every day! Stay focused on your goals.",
        "Progress takes time, and you're making it! Keep pushing forward.",
        "Every challenge is an opportunity to grow. You've got this!"
      ],
      supportive: [
        "Remember, every expert was once a beginner. You're on your journey!",
        "Learning is a process. Be patient with yourself and keep trying.",
        "Every small step forward is a victory. Celebrate your efforts!"
      ]
    };

    const randomMessage = messages[messageType][Math.floor(Math.random() * messages[messageType].length)];

    res.status(200).json({
      message: randomMessage,
      message_type: messageType,
      performance_context: {
        recent_average: recentPerformance.recent_average,
        recent_attempts: recentPerformance.recent_attempts,
        last_attempt_date: recentPerformance.last_attempt_date
      }
    });

  } catch (error) {
    console.error('Error generating motivational message:', error);
    res.status(500).json({ message: 'Error generating motivational message' });
  }
};
