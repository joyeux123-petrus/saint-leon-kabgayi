const connectToDatabase = require('../db.js');
const mapQuestionType = require('../utils/questionTypeMapper');


const createQuiz = async (req, res) => {
  const db = await connectToDatabase();
  console.log('=== QUIZ CREATION REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('User ID:', req.user.id);
  
  let { subject_name, title, description, time_limit, start_time, end_time, randomize_questions, is_team_based, is_active, questions, class_name, note_id } = req.body;
  const created_by = req.user.id;

  // Ensure is_active is true by default for new quizzes
  if (is_active === undefined || is_active === null || is_active === false) {
      is_active = true;
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const quizQuery = 'INSERT INTO quizzes (subject_name, title, description, time_limit, start_time, end_time, randomize_questions, is_team_based, is_active, created_by, class_name, note_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [quizResult] = await connection.query(quizQuery, [subject_name, title, description, time_limit, start_time, end_time, randomize_questions, is_team_based, is_active, created_by, class_name, note_id]);

    const quizId = quizResult.insertId;
    let additionalDataPromises = [];

    if (questions && questions.length > 0) {
      const questionPromises = questions.map(async (q, index) => {
        const {
          question_text = '',
          question_type: rawQuestionType = 'MCQ_single_answer',
          media_url = null,
          correct_answer = '',
          question_order = 0,
          time_limit = 0,
          points = 1
        } = q;

        const { question_type, mcq_type } = mapQuestionType(rawQuestionType);

        const questionQuery = 'INSERT INTO questions (quiz_id, question_text, question_type, media_url, correct_answer, `question_order`, time_limit, points, mcq_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [questionResult] = await connection.query(questionQuery, [quizId, question_text, question_type, media_url, correct_answer, question_order || index, time_limit, Number(points), mcq_type]);

        const questionId = questionResult.insertId;
        const sequenceQuery = 'INSERT INTO question_sequences (quiz_id, question_id, `question_order`) VALUES (?, ?, ?)';
        await connection.query(sequenceQuery, [quizId, questionId, q.order || index]);

        switch (q.question_type) {
          case 'MCQ_single_answer':
          case 'MCQ_multiple_answers':
          case 'True/False':
            if (q.options && q.options.length > 0) {
              const optionPromises = q.options.map(async (opt) => {
                const optionQuery = 'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)';
                await connection.query(optionQuery, [questionId, opt.option_text, opt.is_correct]);
              });
              await Promise.all(optionPromises);
            }
            break;
          case 'Matching':
            if (q.matching_pairs && q.matching_pairs.length > 0) {
              const matchingPromises = q.matching_pairs.map(async (pair) => {
                const matchingQuery = 'INSERT INTO question_options_matching (question_id, prompt, correct_match) VALUES (?, ?, ?)';
                await connection.query(matchingQuery, [questionId, pair.prompt, pair.correct_match]);
              });
              await Promise.all(matchingPromises);
            }
            break;
          case 'Video':
            if (q.sub_questions && q.sub_questions.length > 0) {
              const subQuestionPromises = q.sub_questions.map(async (subQ, subIndex) => {
                const subQuestionQuery = 'INSERT INTO questions (quiz_id, question_text, question_type, correct_answer, `question_order`, time_limit, parent_question_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
                const [subQuestionResult] = await connection.query(subQuestionQuery, [quizId, subQ.question_text, mapQuestionType(subQ.question_type), subQ.correct_answer, subQ.order || subIndex, subQ.time_limit, questionId]);

                const subQuestionId = subQuestionResult.insertId;
                const subSequenceQuery = 'INSERT INTO question_sequences (quiz_id, question_id, `order`) VALUES (?, ?, ?)';
                await connection.query(subSequenceQuery, [quizId, subQuestionId, subQ.order || subIndex]);

                switch (subQ.question_type) {
                  case 'MCQ_single_answer':
                  case 'MCQ_multiple_answers':
                  case 'True/False':
                    if (subQ.options && subQ.options.length > 0) {
                      const subOptionPromises = subQ.options.map(async (subOpt) => {
                        const subOptionQuery = 'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)';
                        await connection.query(subOptionQuery, [subQuestionId, subOpt.option_text, subOpt.is_correct]);
                      });
                      await Promise.all(subOptionPromises);
                    }
                    break;
                  case 'Fill-in-the-Blank':
                  case 'Short_Answer':
                    break;
                  default:
                    break;
                }
              });
              await Promise.all(subQuestionPromises);
            }
            break;
          default:
            break;
        }
      });
      await Promise.all(questionPromises);
    }

    await connection.commit();
    res.status(201).json({ message: 'Quiz created successfully', quizId });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating quiz:', err);
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        errors: ["Selected subject does not exist"]
      });
    }
    res.status(500).json({ message: 'Error creating quiz', error: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Get all quizzes available to students
async function getQuizzes(req, res) {
  try {
    const db = await connectToDatabase();

    const [quizzes] = await db.query(`
      SELECT 
          q.quiz_id,
          q.title,
          q.description,
          s.name AS subject_name,
          q.class_name,
          q.start_time,
          q.end_time,
          q.time_limit,
          q.is_active,
          q.quiz_type, -- Added quiz_type
          u.name AS teacher_name
      FROM quizzes q
      JOIN users u ON q.created_by = u.id
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      WHERE q.is_active = TRUE -- Filter for active quizzes
      ORDER BY q.start_time DESC
    `);

    console.log('Fetched quizzes:', quizzes);
    console.log('Number of quizzes fetched:', quizzes.length);

    return res.json(quizzes);
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    return res.status(500).json({ message: 'Error fetching quizzes', error: err.message });
  }
}

async function fetchQuizDetailsFromDb(db, quizId) {
  try {
    const [rows] = await db.query(
      `SELECT
          q.quiz_id AS quiz_id,
          q.title AS quiz_title,
          q.description AS quiz_description,
          q.quiz_type,
          q.is_team_based,
          q.attempt_limit,
          q.passing_score,
          q.instructions,
          q.note_id,
          q.start_time AS quiz_start_time,
          q.end_time AS quiz_end_time,
          q.time_limit AS quiz_time_limit,
          ques.question_id,
          ques.question_text,
          ques.question_type,
          ques.media_url,
          ques.time_limit AS question_time_limit,
          ques.parent_question_id,
          ques.points,
          ques.mcq_type,
          ques.difficulty_level,
          opt.option_id AS option_id,
          opt.option_text,
          opt.is_correct,
          opt.option_order,
          match_pair.id AS match_pair_id,
          match_pair.prompt,
          match_pair.correct_match
      FROM quizzes q
      LEFT JOIN questions ques ON q.quiz_id = ques.quiz_id
      LEFT JOIN options opt ON ques.question_id = opt.question_id
      LEFT JOIN question_options_matching match_pair ON ques.question_id = match_pair.question_id
      WHERE q.quiz_id = ? AND q.is_active = TRUE
      ORDER BY ques.parent_question_id ASC, ques.question_order ASC, ques.question_id ASC, opt.option_id ASC, match_pair.id ASC`,
      [quizId]
    );

    // Process rows into nested structure
    const quiz = {
      quiz_id: null,
      title: '',
      description: '',
      quiz_type: '',
      is_team_based: false,
      attempt_limit: 1,
      passing_score: 50,
      instructions: '',
      note_id: null,
      quiz_start_time: null,
      quiz_end_time: null,
      quiz_time_limit: null,
      questions: []
    };

    const questionMap = new Map();

    rows.forEach(row => {
      if (!quiz.quiz_id) {
        quiz.quiz_id = row.quiz_id;
        quiz.title = row.quiz_title;
        quiz.description = row.quiz_description;
        quiz.quiz_type = row.quiz_type;
        quiz.is_team_based = row.is_team_based;
        quiz.attempt_limit = row.attempt_limit;
        quiz.passing_score = row.passing_score;
        quiz.instructions = row.instructions;
        quiz.note_id = row.note_id;
        quiz.quiz_start_time = row.quiz_start_time;
        quiz.quiz_end_time = row.quiz_end_time;
        quiz.quiz_time_limit = row.quiz_time_limit;
      }

      // Handle question
      if (!questionMap.has(row.question_id)) {
        questionMap.set(row.question_id, {
          question_id: row.question_id,
          question_text: row.question_text,
          question_type: row.question_type,
          time_limit: row.question_time_limit,
          parent_question_id: row.parent_question_id,
          points: row.points,
          mcq_type: row.mcq_type,
          difficulty_level: row.difficulty_level,
          options: [],
          match_pairs: []
        });
      }

      const question = questionMap.get(row.question_id);

      // Add option if exists
      if (row.option_id) {
        question.options.push({
          option_id: row.option_id,
          option_text: row.option_text,
          is_correct: row.is_correct,
          option_order: row.option_order
        });
      }

      // Add match pair if exists
      if (row.match_pair_id) {
        question.match_pairs.push({
          match_pair_id: row.match_pair_id,
          prompt: row.prompt,
          correct_match: row.correct_match
        });
      }
    });

    quiz.questions = Array.from(questionMap.values());
    return quiz;

  } catch (err) {
    console.error('Error fetching quiz details:', err);
    throw new Error('Error fetching quiz details');
  }
}

const getQuizDetails = async (req, res) => {
  const db = await connectToDatabase();
  const { quiz_id } = req.params;

  try {
    const quiz = await fetchQuizDetailsFromDb(db, quiz_id);

    if (!quiz || !quiz.quiz_id) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ success: true, data: quiz });
  } catch (err) {
    console.error('Error fetching quiz details:', err);
    res.status(500).json({ message: 'Error fetching quiz details', error: err.message });
  }
};

const updateQuiz = async (req, res) => {
  const db = await connectToDatabase();
  const { quiz_id } = req.params;
  const { subject_name, title, description, time_limit, start_time, end_time, randomize_questions, is_team_based, is_active, questions, note_id } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const quizUpdateQuery = 'UPDATE quizzes SET subject_name = ?, title = ?, description = ?, time_limit = ?, start_time = ?, end_time = ?, randomize_questions = ?, is_team_based = ?, is_active = ?, note_id = ? WHERE id = ?';
    const [quizResult] = await connection.query(quizUpdateQuery, [subject_name, title, description, time_limit, start_time, end_time, randomize_questions, is_team_based, is_active, note_id, quiz_id]);

    if (quizResult.affectedRows === 0) {
      throw new Error('Quiz not found');
    }

    await connection.query('DELETE FROM questions WHERE quiz_id = ?', [id]);
    await connection.query('DELETE FROM question_sequences WHERE quiz_id = ?', [id]);

    if (questions && questions.length > 0) {
      for (const [index, q] of questions.entries()) {
        const questionInsertQuery = 'INSERT INTO questions (quiz_id, question_text, question_type, media_url, correct_answer, `question_order`, time_limit, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const [questionResult] = await connection.query(questionInsertQuery, [quiz_id, q.question_text, mapQuestionType(q.question_type), q.media_url, q.correct_answer, q.order || index, q.time_limit, q.points]);
        const questionId = questionResult.insertId;

        const sequenceQuery = 'INSERT INTO question_sequences (quiz_id, question_id, `order`) VALUES (?, ?, ?)';
        await connection.query(sequenceQuery, [id, questionId, q.order || index]);

        if (q.options && q.options.length > 0) {
          for (const opt of q.options) {
            const optionQuery = 'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)';
            await connection.query(optionQuery, [questionId, opt.option_text, opt.is_correct]);
          }
        }

        if (q.matching_pairs && q.matching_pairs.length > 0) {
          for (const pair of q.matching_pairs) {
            const matchingQuery = 'INSERT INTO question_options_matching (question_id, prompt, correct_match) VALUES (?, ?, ?)';
            await connection.query(matchingQuery, [questionId, pair.prompt, pair.correct_match]);
          }
        }

        if (q.sub_questions && q.sub_questions.length > 0) {
          for (const [subIndex, subQ] of q.sub_questions.entries()) {
            const subQuestionQuery = 'INSERT INTO questions (quiz_id, question_text, question_type, correct_answer, `order`, time_limit, parent_question_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const [subQuestionResult] = await connection.query(subQuestionQuery, [id, subQ.question_text, mapQuestionType(subQ.question_type), subQ.correct_answer, subQ.order || subIndex, subQ.time_limit, questionId]);
            const subQuestionId = subQuestionResult.insertId;

            const subSequenceQuery = 'INSERT INTO question_sequences (quiz_id, question_id, `order`) VALUES (?, ?, ?)';
            await connection.query(subSequenceQuery, [id, subQuestionId, subQ.order || subIndex]);

            if (subQ.options && subQ.options.length > 0) {
              for (const subOpt of subQ.options) {
                const subOptionQuery = 'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)';
                await connection.query(subOptionQuery, [subQuestionId, subOpt.option_text, subOpt.is_correct]);
              }
            }
          }
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: 'Quiz updated successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error updating quiz:', err);
    res.status(500).json({ message: 'Error updating quiz' });
  } finally {
    if (connection) connection.release();
  }
};

const deleteQuiz = async (req, res) => {
  const db = await connectToDatabase();
  const quizId = req.params.quiz_id;
  const userId = req.user.id; // Assuming user ID is available from auth middleware
  const userRole = req.user.role; // Assuming user role is available from auth middleware

  console.log(`Attempting to delete quiz: ${quizId} by user: ${userId} with role: ${userRole}`);

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // First, verify if the quiz exists and if the user has permission to delete it
    const [quiz] = await connection.query('SELECT created_by FROM quizzes WHERE id = ?', [quizId]);

    if (quiz.length === 0) {
      console.log(`Quiz ${quizId} not found.`);
      await connection.rollback();
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Only the creator or an admin can delete the quiz
    if (userRole === 'teacher' && quiz[0].created_by !== userId) {
      console.log(`User ${userId} (teacher) attempted to delete quiz ${quizId} not created by them.`);
      await connection.rollback();
      return res.status(403).json({ message: 'Forbidden: You can only delete quizzes you created.' });
    }

    console.log(`Deleting related data for quiz ${quizId}...`);

    // Delete related data in correct order to avoid foreign key constraints issues
    // Delete student answers first, as they depend on quiz attempts and questions
    await connection.query('DELETE FROM student_answers WHERE quiz_attempt_id IN (SELECT attempt_id FROM quiz_attempts WHERE quiz_id = ?)', [quizId]);
    console.log('Deleted student_answers.');

    // Delete quiz attempts
    await connection.query('DELETE FROM quiz_attempts WHERE quiz_id = ?', [quizId]);
    console.log('Deleted quiz_attempts.');

    // Delete options and matching pairs (depend on questions)
    await connection.query('DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = ?)', [quizId]);
    console.log('Deleted options.');
    await connection.query('DELETE FROM question_options_matching WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = ?)', [quizId]);
    console.log('Deleted question_options_matching.');

    // Delete question sequences
    await connection.query('DELETE FROM question_sequences WHERE quiz_id = ?', [quizId]);
    console.log('Deleted question_sequences.');

    // Delete questions
    await connection.query('DELETE FROM questions WHERE quiz_id = ?', [quizId]);
    console.log('Deleted questions.');

    // Finally, delete the quiz itself
    const [result] = await connection.query('DELETE FROM quizzes WHERE id = ?', [quizId]);
    console.log(`Deleted quiz ${quizId}. Affected rows: ${result.affectedRows}`);

    if (result.affectedRows === 0) {
      console.log(`Quiz ${quizId} not found after all deletions (should not happen if quiz existed initially).`);
      await connection.rollback();
      return res.status(404).json({ message: 'Quiz not found after all deletions (should not happen if quiz existed initially)' });
    }

    await connection.commit();
    console.log(`Quiz ${quizId} and all related data deleted successfully.`);
    res.status(200).json({ message: 'Quiz and all related data deleted successfully' });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting quiz and related data:', err);
    return res.status(500).json({ message: 'Error deleting quiz and related data', error: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getTeacherQuizzes = async (req, res) => {
  const db = await connectToDatabase();
  const teacherId = req.user.id; // Assuming teacher ID is available from auth middleware
  try {
    const query = 'SELECT q.*, s.name as subject_name FROM quizzes q JOIN subjects s ON q.subject_id = s.subject_id WHERE q.created_by = ?';
    const [results] = await db.query(query, [teacherId]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching teacher quizzes:', err);
    return res.status(500).json({ message: 'Error fetching teacher quizzes' });
  }
};

const getQuizByNoteId = async (req, res) => {
  const db = await connectToDatabase();
  const { note_id } = req.params;

  try {
    const [quizzes] = await db.query('SELECT * FROM quizzes WHERE note_id = ?', [note_id]);
    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'No quizzes found for this note ID' });
    }
    res.status(200).json(quizzes);
  } catch (err) {
    console.error('Error fetching quizzes by note ID:', err);
    res.status(500).json({ message: 'Error fetching quizzes by note ID', error: err.message });
  }
};

module.exports = {
    createQuiz,
    getQuizzes,
    getQuizDetails,
    getQuizByNoteId,
    updateQuiz,
    deleteQuiz,
    getTeacherQuizzes
};