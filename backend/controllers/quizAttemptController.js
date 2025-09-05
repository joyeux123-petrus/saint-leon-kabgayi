const connectToDatabase = require('../db');
const leaderboardController = require('../controllers/leaderboardController');

exports.startQuizAttempt = async (req, res) => {
  const db = await connectToDatabase();
  const { quiz_id } = req.params;
  const student_id = req.user.id;

  try {
    const [quiz] = await db.query('SELECT quiz_id FROM quizzes WHERE quiz_id = ? AND is_active = TRUE', [quiz_id]);
    if (quiz.length === 0) {
      return res.status(404).json({ message: 'Quiz not found or is not active.' });
    }

    const query = 'INSERT INTO quiz_attempts (quiz_id, student_id) VALUES (?, ?)';
    const [rows] = await db.query(query, [quiz_id, student_id]);
    console.log('Database insert result (rows):', rows); // Log rows directly
    res.status(201).json({ message: 'Quiz attempt started successfully', attemptId: rows.insertId });
  } catch (err) {
    console.error('Error starting quiz attempt:', err);
    res.status(500).json({ message: 'Error starting quiz attempt' });
  }
};

exports.submitAnswers = async (req, res) => {
  const db = await connectToDatabase();
  const { attempt_id } = req.params;
  const { answers } = req.body; // Destructure only answers, feedback and ai_personalization can be handled later
  const student_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [attemptResult] = await connection.query('SELECT * FROM quiz_attempts WHERE attempt_id = ? AND student_id = ?', [attempt_id, student_id]);
    if (attemptResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Quiz attempt not found or unauthorized' });
    }

    let totalScore = 0;
    const totalQuestions = answers.length; // Assuming each answer corresponds to a question for now

    const answerPromises = answers.map(async answer => {
      const { question_id, selected_option_id, answer_text } = answer;

      // Fetch question details including correct answers for all types
      const [questionDetails] = await connection.query(
        `SELECT 
            q.question_type, 
            q.correct_answer, 
            q.points, 
            o.is_correct as option_is_correct, 
            qom.prompt, 
            qom.correct_match
         FROM questions q
         LEFT JOIN options o ON q.id = o.question_id AND o.id = ?
         LEFT JOIN question_options_matching qom ON q.id = qom.question_id
         WHERE q.id = ?`,
        [selected_option_id, question_id]
      );

      if (questionDetails.length === 0) {
        console.warn(`Question or option not found for question_id: ${question_id}, selected_option_id: ${selected_option_id}`);
        // Still insert the answer, but mark as incorrect/ungraded
        const insertAnswerQuery = 'INSERT INTO student_answers (attempt_id, question_id, selected_option_id, answer_text, is_correct, score) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.query(insertAnswerQuery, [attempt_id, question_id, selected_option_id, answer_text, false, 0]);
        return; // Skip grading for this question
      }

      const question = questionDetails[0];
      let isCorrect = false;
      let score = 0;

      switch (question.question_type) {
        case 'MCQ_single_answer':
        case 'MCQ_multiple_answers':
        case 'True/False':
          isCorrect = question.option_is_correct === 1;
          if (isCorrect) {
            score = question.points || 1;
          }
          break;
        case 'Fill-in-the-Blank':
          if (question.correct_answer && answer_text && answer_text.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()) {
            isCorrect = true;
            score = question.points || 1;
          } else {
            isCorrect = null; // Needs manual review if no exact match or no correct answer provided
            score = 0;
          }
          break;
        case 'Short_Answer':
        case 'Open-ended':
        case 'Peer-Graded':
        case 'Video': // Assuming video questions might have text answers that need manual review
        case 'Audio': // Assuming audio questions might have text answers that need manual review
          isCorrect = null; // Always requires manual review
          score = 0;
          break;
        case 'Matching':
          try {
            const submittedMatches = JSON.parse(answer_text); // Frontend sends as JSON string
            let correctMatchesCount = 0;
            let totalPairs = 0;

            // Fetch all correct matching pairs for this question
            const [correctMatchingPairs] = await connection.query(
              'SELECT prompt, correct_match FROM question_options_matching WHERE question_id = ?',
              [question_id]
            );

            const correctMap = new Map();
            correctMatchingPairs.forEach(pair => correctMap.set(pair.prompt, pair.correct_match));

            // Iterate through submitted matches and compare with correct answers
            for (const promptText in submittedMatches) {
                totalPairs++;
                const submittedMatchText = submittedMatches[promptText];
                if (correctMap.has(promptText) && correctMap.get(promptText) === submittedMatchText) {
                    correctMatchesCount++;
                }
            }

            if (totalPairs > 0) {
                // Calculate score based on proportion of correct matches
                score = (correctMatchesCount / totalPairs) * (question.points || 1);
                isCorrect = (correctMatchesCount === totalPairs); // Only fully correct if all match
            } else {
                isCorrect = false;
                score = 0;
            }
          } catch (e) {
            console.error('Error parsing matching answer_text or grading:', e);
            isCorrect = false;
            score = 0;
          }
          break;
        default:
          // Fallback for any unhandled or new question types, assumes manual grading
          isCorrect = null;
          score = 0;
          break;
      }

      // Accumulate total score only for questions that are graded automatically
      if (isCorrect !== null) {
        totalScore += score;
      }

      const insertAnswerQuery = 'INSERT INTO student_answers (attempt_id, question_id, selected_option_id, answer_text, is_correct, score) VALUES (?, ?, ?, ?, ?, ?)';
      await connection.query(insertAnswerQuery, [attempt_id, question_id, selected_option_id, answer_text, isCorrect, score]);
    });

    await Promise.all(answerPromises);

    // Update total score in quiz_attempts table
    const updateAttemptQuery = 'UPDATE quiz_attempts SET submitted_at = CURRENT_TIMESTAMP, score = ?, is_completed = TRUE WHERE attempt_id = ?';
    await connection.query(updateAttemptQuery, [totalScore, attempt_id]);

    // Update leaderboard after successful quiz submission
    await leaderboardController.updateLeaderboard(attemptResult[0].quiz_id, student_id, totalScore);

    await connection.commit();
    res.status(200).json({ message: 'Answers submitted successfully', totalScore });
  } catch (err) {
    await connection.rollback();
    console.error('Error submitting answers:', err);
    res.status(500).json({ message: 'Error processing answers' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getAttemptResults = async (req, res) => {
  const db = await connectToDatabase();
  const { attempt_id } = req.params;
  const student_id = req.user.id;

  try {
    const [attemptResult] = await db.query('SELECT qa.*, q.title as quiz_title, q.quiz_id as quiz_id, u.name as student_name FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.quiz_id JOIN users u ON qa.student_id = u.id WHERE qa.attempt_id = ? AND qa.student_id = ?', [attempt_id, student_id]);

    if (attemptResult.length === 0) {
      return res.status(404).json({ message: 'Quiz attempt not found or unauthorized' });
    }

    const attempt = attemptResult[0];
    const quizId = attempt.quiz_id;

    const [rawQuestions] = await db.query('SELECT q.*, qs.question_order FROM questions q JOIN question_sequences qs ON q.question_id = qs.question_id WHERE q.quiz_id = ? ORDER BY qs.question_order ASC', [quizId]);

    const [studentAnswers] = await db.query('SELECT sa.*, o.option_text as selected_option_text FROM student_answers sa LEFT JOIN options o ON sa.selected_option_id = o.id WHERE sa.attempt_id = ?', [attempt_id]);

    const answersMap = new Map();
    studentAnswers.forEach(ans => answersMap.set(ans.question_id, ans));

    const processQuestions = async (questionsArray) => {
      return await Promise.all(questionsArray.map(async (q) => {
        let options = [];
        let matching_pairs = [];
        let sub_questions = [];
        let student_answer = answersMap.get(q.question_id) || null;

        if (q.question_type === 'MCQ_single_answer' || q.question_type === 'MCQ_multiple_answers' || q.question_type === 'True/False') {
          const [opts] = await db.query('SELECT * FROM options WHERE question_id = ?', [q.question_id]);
          options = opts;
        }
        else if (q.question_type === 'Matching') {
          const [pairs] = await db.query('SELECT * FROM question_options_matching WHERE question_id = ?', [q.question_id]);
          matching_pairs = pairs;
        }
        else if (q.question_type === 'Video') {
          const [rawSubQuestions] = await db.query('SELECT q.*, qs.question_order FROM questions q JOIN question_sequences qs ON q.question_id = qs.question_id WHERE q.parent_question_id = ? ORDER BY qs.question_order ASC', [q.question_id]);
          sub_questions = await processQuestions(rawSubQuestions);
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
            selected_option_text: student_answer.selected_option_text
          } : null,
        };
      }));
    };

    const mainQuestions = rawQuestions.filter(q => q.parent_question_id === null);
    attempt.questions = await processQuestions(mainQuestions);

    res.status(200).json(attempt);

  } catch (err) {
    console.error('Error fetching quiz attempt details:', err);
    res.status(500).json({ message: 'Error fetching quiz attempt details' });
  }
};

exports.getStudentQuizAttempts = async (req, res) => {
  const db = await connectToDatabase();
  try {
    const studentId = req.user.id;

    const query = `
      SELECT
        qa.attempt_id as attempt_id,
        qa.score,
        qa.submitted_at,
        q.title as quiz_title,
        u.name as student_name
      FROM
        quiz_attempts qa
      JOIN
        quizzes q ON qa.quiz_id = q.quiz_id
      JOIN
        users u ON qa.student_id = u.id
      WHERE
        qa.student_id = ? AND qa.is_completed = TRUE
      ORDER BY
        qa.submitted_at DESC
    `;
    const [attempts] = await db.query(query, [studentId]);

    res.status(200).json(attempts);
  } catch (error) {
    console.error('Error fetching student quiz attempts:', error);
    res.status(500).json({ message: 'Error fetching student quiz attempts' });
  }
};