const db = require('../db');

exports.getQuizPerformanceSummary = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    // Verify that this quiz belongs to the authenticated teacher
    const [quizVerification] = await db.promise().query(
      'SELECT id FROM quizzes WHERE id = ? AND created_by = ?',
      [quizId, teacherId]
    );

    if (quizVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to view performance for this quiz' });
    }

    // Calculate average score for the quiz
    const [avgScoreResult] = await db.promise().query(
      'SELECT AVG(score) as average_score FROM quiz_attempts WHERE quiz_id = ? AND is_completed = TRUE',
      [quizId]
    );
    const average_score = avgScoreResult[0].average_score || 0;

    // Count total students who completed the quiz
    const [completedStudentsResult] = await db.promise().query(
      'SELECT COUNT(DISTINCT student_id) as total_students_completed FROM quiz_attempts WHERE quiz_id = ? AND is_completed = TRUE',
      [quizId]
    );
    const total_students_completed = completedStudentsResult[0].total_students_completed || 0;

    res.status(200).json({
      quizId,
      average_score,
      total_students_completed,
    });
  } catch (error) {
    console.error('Error fetching quiz performance summary:', error);
    res.status(500).json({ message: 'Error fetching quiz performance summary' });
  }
};

exports.getTeacherQuizAttempts = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get quizzes created by this teacher
    const [teacherQuizzes] = await db.promise().query('SELECT id FROM quizzes WHERE created_by = ?', [teacherId]);
    const quizIds = teacherQuizzes.map(q => q.id);

    if (quizIds.length === 0) {
      return res.status(200).json([]); // No quizzes created by this teacher
    }

    // Fetch all attempts for these quizzes
    const query = `
      SELECT
        qa.id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name,
        u.className as student_class
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.quiz_id IN (?) AND qa.is_completed = TRUE
      ORDER BY
        qa.submitted_at DESC
    `;
    const [attempts] = await db.promise().query(query, [quizIds]);

    res.status(200).json(attempts);
  } catch (error) {
    console.error('Error fetching teacher quiz attempts:', error);
    res.status(500).json({ message: 'Error fetching teacher quiz attempts' });
  }
};

exports.getQuizAttemptsByQuizId = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    // Verify that this quiz belongs to the authenticated teacher
    const [quizVerification] = await db.promise().query(
      'SELECT id FROM quizzes WHERE id = ? AND created_by = ?',
      [quizId, teacherId]
    );

    if (quizVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to view attempts for this quiz' });
    }

    const query = `
      SELECT
        qa.id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name,
        u.className as student_class
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.quiz_id = ? AND qa.is_completed = TRUE
      ORDER BY
        qa.submitted_at DESC
    `;
    const [attempts] = await db.promise().query(query, [quizId]);

    res.status(200).json(attempts);
  } catch (error) {
    console.error('Error fetching quiz attempts by quiz ID:', error);
    res.status(500).json({ message: 'Error fetching quiz attempts by quiz ID' });
  }
};

exports.getQuizAttemptDetails = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const teacherId = req.user.id;

    // Verify that this attempt belongs to a quiz created by this teacher
    const [attemptVerification] = await db.promise().query(
      'SELECT qa.id, qa.quiz_id FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.id = ? AND q.created_by = ?',
      [attempt_id, teacherId]
    );

    if (attemptVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to view this quiz attempt' });
    }

    const quizId = attemptVerification[0].quiz_id;

    const attemptQuery = `
      SELECT
        qa.id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name,
        u.className as student_class,
        qa.feedback,
        qa.ai_personalization
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.id = ?
    `;
    const [attemptDetails] = await db.promise().query(attemptQuery, [attempt_id]);

    if (attemptDetails.length === 0) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    const attempt = attemptDetails[0];

    // Fetch all questions for the quiz, including sub-questions
    const [rawQuestions] = await db.promise().query('SELECT q.*, qs.order FROM questions q JOIN question_sequences qs ON q.id = qs.question_id WHERE q.quiz_id = ? ORDER BY qs.order ASC', [quizId]);

    // Fetch all student answers for this attempt
    const [studentAnswers] = await db.promise().query('SELECT sa.*, o.option_text as selected_option_text FROM student_answers sa LEFT JOIN options o ON sa.selected_option_id = o.id WHERE sa.attempt_id = ?', [attempt_id]);

    const answersMap = new Map();
    studentAnswers.forEach(ans => answersMap.set(ans.question_id, ans));

    const processQuestions = async (questionsArray) => {
      return await Promise.all(questionsArray.map(async (q) => {
        let options = [];
        let matching_pairs = [];
        let sub_questions = [];
        let student_answer = answersMap.get(q.id) || null;

        // Fetch options for MCQ/True-False
        if (q.question_type === 'MCQ_single_answer' || q.question_type === 'MCQ_multiple_answers' || q.question_type === 'True/False') {
          const [opts] = await db.promise().query('SELECT * FROM options WHERE question_id = ?', [q.id]);
          options = opts;
        }
        // Fetch matching pairs for Matching
        else if (q.question_type === 'Matching') {
          const [pairs] = await db.promise().query('SELECT * FROM question_options_matching WHERE question_id = ?', [q.id]);
          matching_pairs = pairs;
        }
        // Process sub-questions for Video questions
        else if (q.question_type === 'Video') {
          const [rawSubQuestions] = await db.promise().query('SELECT q.*, qs.order FROM questions q JOIN question_sequences qs ON q.id = qs.question_id WHERE q.parent_question_id = ? ORDER BY qs.order ASC', [q.id]);
          sub_questions = await processQuestions(rawSubQuestions); // Recursively process sub-questions
        }

        return {
          ...q,
          options,
          matching_pairs,
          sub_questions,
          student_answer: student_answer ? {
            selected_option_id: student_answer.selected_option_id,
            answer_text: student_answer.answer_text,
            is_correct: student_answer.is_correct,
            score: student_answer.score,
            teacher_feedback: student_answer.teacher_feedback,
            ai_feedback: student_answer.ai_feedback,
            selected_option_text: student_answer.selected_option_text // from LEFT JOIN
          } : null,
        };
      }));
    };

    // Filter out sub-questions from the main list and process them
    const mainQuestions = rawQuestions.filter(q => q.parent_question_id === null);
    attempt.questions = await processQuestions(mainQuestions);

    res.status(200).json(attempt);
  } catch (error) {
    console.error('Error fetching quiz attempt details:', error);
    res.status(500).json({ message: 'Error fetching quiz attempt details' });
  }
};

exports.updateTeacherFeedback = async (req, res) => {
  try {
    const { student_answer_id } = req.params;
    const { teacher_feedback, score } = req.body;
    const teacherId = req.user.id;

    // Verify that this student_answer belongs to a quiz created by this teacher
    const [answerVerification] = await db.promise().query(
      'SELECT sa.id FROM student_answers sa JOIN quiz_attempts qa ON sa.attempt_id = qa.id JOIN quizzes q ON qa.quiz_id = q.id WHERE sa.id = ? AND q.created_by = ?',
      [student_answer_id, teacherId]
    );

    if (answerVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to update feedback for this answer' });
    }

    const updateQuery = 'UPDATE student_answers SET teacher_feedback = ?, score = ? WHERE id = ?';
    const [result] = await db.promise().query(updateQuery, [teacher_feedback, score, student_answer_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student answer not found' });
    }

    // Recalculate total score for the attempt if an answer score was updated
    const [attemptInfo] = await db.promise().query('SELECT attempt_id FROM student_answers WHERE id = ?', [student_answer_id]);
    const attemptId = attemptInfo[0].attempt_id;

    const [totalScoreResult] = await db.promise().query('SELECT SUM(score) as total_score FROM student_answers WHERE attempt_id = ?', [attemptId]);
    const newTotalScore = totalScoreResult[0].total_score || 0; // Ensure it's not null if all scores are null

    await db.promise().query('UPDATE quiz_attempts SET score = ? WHERE id = ?', [newTotalScore, attemptId]);

    res.status(200).json({ message: 'Teacher feedback and score updated successfully' });
  }
  catch (error) {
    console.error('Error updating teacher feedback:', error);
    res.status(500).json({ message: 'Error updating teacher feedback' });
  }
};

exports.getTeacherPendingReviewAttempts = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get quizzes created by this teacher
    const [teacherQuizzes] = await db.promise().query('SELECT id FROM quizzes WHERE created_by = ?', [teacherId]);
    const quizIds = teacherQuizzes.map(q => q.id);

    if (quizIds.length === 0) {
      return res.status(200).json([]); // No quizzes created by this teacher
    }

    // Fetch attempts for these quizzes that have at least one answer needing manual review (is_correct IS NULL)
    const query = `
      SELECT DISTINCT
        qa.id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name,
        u.className as student_class
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        users u ON qa.student_id = u.id
      JOIN
        student_answers sa ON qa.id = sa.attempt_id
      WHERE
        qa.quiz_id IN (?) AND qa.is_completed = TRUE AND sa.is_correct IS NULL
      ORDER BY
        qa.submitted_at DESC
    `;
    const [attempts] = await db.promise().query(query, [quizIds]);

    res.status(200).json(attempts);
  } catch (error) {
    console.error('Error fetching teacher pending review attempts:', error);
    res.status(500).json({ message: 'Error fetching teacher pending review attempts' });
  }
};

exports.gradeStudentAnswer = async (req, res) => {
  try {
    const { student_answer_id } = req.params;
    const { score, teacher_feedback, is_correct } = req.body; // is_correct can be true/false/null
    const teacherId = req.user.id;

    // Verify that this student_answer belongs to a quiz created by this teacher
    const [answerVerification] = await db.promise().query(
      'SELECT sa.id, sa.attempt_id FROM student_answers sa JOIN quiz_attempts qa ON sa.attempt_id = qa.id JOIN quizzes q ON qa.quiz_id = q.id WHERE sa.id = ? AND q.created_by = ?',
      [student_answer_id, teacherId]
    );

    if (answerVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to grade this answer' });
    }

    const attemptId = answerVerification[0].attempt_id;

    const updateQuery = 'UPDATE student_answers SET score = ?, teacher_feedback = ?, is_correct = ? WHERE id = ?';
    const [result] = await db.promise().query(updateQuery, [score, teacher_feedback, is_correct, student_answer_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student answer not found' });
    }

    // Recalculate total score for the attempt
    const [totalScoreResult] = await db.promise().query('SELECT SUM(score) as total_score FROM student_answers WHERE attempt_id = ?', [attemptId]);
    const newTotalScore = totalScoreResult[0].total_score || 0; // Ensure it's not null if all scores are null

    await db.promise().query('UPDATE quiz_attempts SET score = ? WHERE id = ?', [newTotalScore, attemptId]);

    res.status(200).json({ message: 'Student answer graded successfully', newTotalScore });
  } catch (error) {
    console.error('Error grading student answer:', error);
    res.status(500).json({ message: 'Error grading student answer' });
  }
};

exports.getQuizAttemptsByQuizId = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    // Verify that this quiz belongs to the authenticated teacher
    const [quizVerification] = await db.promise().query(
      'SELECT id FROM quizzes WHERE id = ? AND created_by = ?',
      [quizId, teacherId]
    );

    if (quizVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to view attempts for this quiz' });
    }

    const query = `
      SELECT
        qa.id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name,
        u.className as student_class
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.quiz_id = ? AND qa.is_completed = TRUE
      ORDER BY
        qa.submitted_at DESC
    `;
    const [attempts] = await db.promise().query(query, [quizId]);

    res.status(200).json(attempts);
  } catch (error) {
    console.error('Error fetching quiz attempts by quiz ID:', error);
    res.status(500).json({ message: 'Error fetching quiz attempts by quiz ID' });
  }
};

exports.getQuizAttemptDetails = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const teacherId = req.user.id;

    // Verify that this attempt belongs to a quiz created by this teacher
    const [attemptVerification] = await db.promise().query(
      'SELECT qa.id, qa.quiz_id FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.id = ? AND q.created_by = ?',
      [attempt_id, teacherId]
    );

    if (attemptVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to view this quiz attempt' });
    }

    const quizId = attemptVerification[0].quiz_id;

    const attemptQuery = `
      SELECT
        qa.id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name,
        u.className as student_class,
        qa.feedback,
        qa.ai_personalization
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.id = ?
    `;
    const [attemptDetails] = await db.promise().query(attemptQuery, [attempt_id]);

    if (attemptDetails.length === 0) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    const attempt = attemptDetails[0];

    // Fetch all questions for the quiz, including sub-questions
    const [rawQuestions] = await db.promise().query('SELECT q.*, qs.order FROM questions q JOIN question_sequences qs ON q.id = qs.question_id WHERE q.quiz_id = ? ORDER BY qs.order ASC', [quizId]);

    // Fetch all student answers for this attempt
    const [studentAnswers] = await db.promise().query('SELECT sa.*, o.option_text as selected_option_text FROM student_answers sa LEFT JOIN options o ON sa.selected_option_id = o.id WHERE sa.attempt_id = ?', [attempt_id]);

    const answersMap = new Map();
    studentAnswers.forEach(ans => answersMap.set(ans.question_id, ans));

    const processQuestions = async (questionsArray) => {
      return await Promise.all(questionsArray.map(async (q) => {
        let options = [];
        let matching_pairs = [];
        let sub_questions = [];
        let student_answer = answersMap.get(q.id) || null;

        // Fetch options for MCQ/True-False
        if (q.question_type === 'MCQ_single_answer' || q.question_type === 'MCQ_multiple_answers' || q.question_type === 'True/False') {
          const [opts] = await db.promise().query('SELECT * FROM options WHERE question_id = ?', [q.id]);
          options = opts;
        }
        // Fetch matching pairs for Matching
        else if (q.question_type === 'Matching') {
          const [pairs] = await db.promise().query('SELECT * FROM question_options_matching WHERE question_id = ?', [q.id]);
          matching_pairs = pairs;
        }
        // Process sub-questions for Video questions
        else if (q.question_type === 'Video') {
          const [rawSubQuestions] = await db.promise().query('SELECT q.*, qs.order FROM questions q JOIN question_sequences qs ON q.id = qs.question_id WHERE q.parent_question_id = ? ORDER BY qs.order ASC', [q.id]);
          sub_questions = await processQuestions(rawSubQuestions); // Recursively process sub-questions
        }

        return {
          ...q,
          options,
          matching_pairs,
          sub_questions,
          student_answer: student_answer ? {
            selected_option_id: student_answer.selected_option_id,
            answer_text: student_answer.answer_text,
            is_correct: student_answer.is_correct,
            score: student_answer.score,
            teacher_feedback: student_answer.teacher_feedback,
            ai_feedback: student_answer.ai_feedback,
            selected_option_text: student_answer.selected_option_text // from LEFT JOIN
          } : null,
        };
      }));
    };

    // Filter out sub-questions from the main list and process them
    const mainQuestions = rawQuestions.filter(q => q.parent_question_id === null);
    attempt.questions = await processQuestions(mainQuestions);

    res.status(200).json(attempt);
  } catch (error) {
    console.error('Error fetching quiz attempt details:', error);
    res.status(500).json({ message: 'Error fetching quiz attempt details' });
  }
};

exports.updateTeacherFeedback = async (req, res) => {
  try {
    const { student_answer_id } = req.params;
    const { teacher_feedback, score } = req.body;
    const teacherId = req.user.id;

    // Verify that this student_answer belongs to a quiz created by this teacher
    const [answerVerification] = await db.promise().query(
      'SELECT sa.id FROM student_answers sa JOIN quiz_attempts qa ON sa.attempt_id = qa.id JOIN quizzes q ON qa.quiz_id = q.id WHERE sa.id = ? AND q.created_by = ?',
      [student_answer_id, teacherId]
    );

    if (answerVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to update feedback for this answer' });
    }

    const updateQuery = 'UPDATE student_answers SET teacher_feedback = ?, score = ? WHERE id = ?';
    const [result] = await db.promise().query(updateQuery, [teacher_feedback, score, student_answer_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student answer not found' });
    }

    // Recalculate total score for the attempt if an answer score was updated
    const [attemptInfo] = await db.promise().query('SELECT attempt_id FROM student_answers WHERE id = ?', [student_answer_id]);
    const attemptId = attemptInfo[0].attempt_id;

    const [totalScoreResult] = await db.promise().query('SELECT SUM(score) as total_score FROM student_answers WHERE attempt_id = ?', [attemptId]);
    const newTotalScore = totalScoreResult[0].total_score || 0; // Ensure it's not null if all scores are null

    await db.promise().query('UPDATE quiz_attempts SET score = ? WHERE id = ?', [newTotalScore, attemptId]);

    res.status(200).json({ message: 'Teacher feedback and score updated successfully' });
  }
  catch (error) {
    console.error('Error updating teacher feedback:', error);
    res.status(500).json({ message: 'Error updating teacher feedback' });
  }
};

exports.getTeacherPendingReviewAttempts = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get quizzes created by this teacher
    const [teacherQuizzes] = await db.promise().query('SELECT id FROM quizzes WHERE created_by = ?', [teacherId]);
    const quizIds = teacherQuizzes.map(q => q.id);

    if (quizIds.length === 0) {
      return res.status(200).json([]); // No quizzes created by this teacher
    }

    // Fetch attempts for these quizzes that have at least one answer needing manual review (is_correct IS NULL)
    const query = `
      SELECT DISTINCT
        qa.id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name,
        u.className as student_class
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.id
      JOIN
        users u ON qa.student_id = u.id
      JOIN
        student_answers sa ON qa.id = sa.attempt_id
      WHERE
        qa.quiz_id IN (?) AND qa.is_completed = TRUE AND sa.is_correct IS NULL
      ORDER BY
        qa.submitted_at DESC
    `;
    const [attempts] = await db.promise().query(query, [quizIds]);

    res.status(200).json(attempts);
  } catch (error) {
    console.error('Error fetching teacher pending review attempts:', error);
    res.status(500).json({ message: 'Error fetching teacher pending review attempts' });
  }
};

exports.gradeStudentAnswer = async (req, res) => {
  try {
    const { student_answer_id } = req.params;
    const { score, teacher_feedback, is_correct } = req.body; // is_correct can be true/false/null
    const teacherId = req.user.id;

    // Verify that this student_answer belongs to a quiz created by this teacher
    const [answerVerification] = await db.promise().query(
      'SELECT sa.id, sa.attempt_id FROM student_answers sa JOIN quiz_attempts qa ON sa.attempt_id = qa.id JOIN quizzes q ON qa.quiz_id = q.id WHERE sa.id = ? AND q.created_by = ?',
      [student_answer_id, teacherId]
    );

    if (answerVerification.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to grade this answer' });
    }

    const attemptId = answerVerification[0].attempt_id;

    const updateQuery = 'UPDATE student_answers SET score = ?, teacher_feedback = ?, is_correct = ? WHERE id = ?';
    const [result] = await db.promise().query(updateQuery, [score, teacher_feedback, is_correct, student_answer_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student answer not found' });
    }

    // Recalculate total score for the attempt
    const [totalScoreResult] = await db.promise().query('SELECT SUM(score) as total_score FROM student_answers WHERE attempt_id = ?', [attemptId]);
    const newTotalScore = totalScoreResult[0].total_score || 0; // Ensure it's not null if all scores are null

    await db.promise().query('UPDATE quiz_attempts SET score = ? WHERE id = ?', [newTotalScore, attemptId]);

    res.status(200).json({ message: 'Student answer graded successfully', newTotalScore });
  } catch (error) {
    console.error('Error grading student answer:', error);
    res.status(500).json({ message: 'Error grading student answer' });
  }
};