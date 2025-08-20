const db = require('../models/db');

// List quiz results filtered by class and subject
exports.listQuizResultsByClassSubject = async (req, res) => {
  const { classId, subjectId } = req.query;
  if (!classId || !subjectId) return res.status(400).json({ error: 'classId and subjectId required.' });
  try {
    const [results] = await db.query(
      'SELECT r.id, u.name AS student, q.title AS quiz, r.score FROM quiz_results r JOIN quizzes q ON r.quiz_id = q.id JOIN users u ON r.student_id = u.id WHERE q.class = ? AND q.subject_id = ?',
      [classId, subjectId]
    );
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz results.' });
  }
};
// Fetch recent quiz results for dashboard
exports.recentQuizResults = async (req, res) => {
  try {
    const [results] = await db.query('SELECT q.title AS quiz, q.class, AVG(r.score) AS avgScore FROM quiz_results r JOIN quizzes q ON r.quiz_id = q.id GROUP BY r.quiz_id, q.title, q.class ORDER BY r.quiz_id DESC LIMIT 10');
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz results.' });
  }
};

exports.listQuizzes = async (req, res) => {
  try {
    const { classId } = req.query;
    let sql = 'SELECT id, title, class, date AS dueDate FROM quizzes WHERE published = 1'; // Assuming 'date' can be used as 'dueDate' and 'published' column exists
    const params = [];

    // Filter by class if classId is provided
    if (classId) {
      sql += ' AND class = ?';
      params.push(classId);
    }

    // Filter for upcoming quizzes (assuming 'date' is the due date)
    sql += ' AND date >= CURDATE() ORDER BY date ASC'; // CURDATE() is for MySQL

    const [quizzes] = await db.query(sql, params);
    res.json({ quizzes });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes.' });
  }
};

exports.adminListQuizzes = async (req, res) => {
    try {
        const [quizzes] = await db.query('SELECT q.id, q.title, s.name as subject, u.name as teacher, q.date as date_created FROM quizzes q JOIN subjects s ON q.subject_id = s.id JOIN users u ON q.teacher_id = u.id');
        res.json({ quizzes });
    } catch (err) {
        console.error('Error fetching quizzes for admin:', err);
        res.status(500).json({ error: 'Failed to fetch quizzes.' });
    }
};

exports.createQuiz = async (req, res) => {
  const {
    lessonName,
    class: quizClass,
    startTime,
    endTime,
    perQuestionTime,
    timingMode,
    questions
  } = req.body;
  if (!lessonName || !quizClass || !startTime || !endTime || !questions || !questions.length) {
    return res.status(400).json({ message: 'Missing required quiz fields.' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Insert quiz
    const [quizResult] = await conn.query(
      'INSERT INTO quizzes (title, class, start_time, end_time, per_question_time, timing_mode) VALUES (?, ?, ?, ?, ?, ?)',
      [lessonName, quizClass, startTime, endTime, perQuestionTime, timingMode]
    );
    const quizId = quizResult.insertId;
    // Insert questions
    for (const q of questions) {
      await conn.query(
        'INSERT INTO quiz_questions (quiz_id, text, type, marks, choices, correct_answer, media_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          quizId,
          q.text,
          q.type,
          q.marks,
          q.type === 'mcq' ? JSON.stringify(q.choices) : null,
          q.type === 'mcq' ? q.correctAnswer : null,
          q.mediaUrl || null
        ]
      );
    }
    await conn.commit();
    res.json({ message: 'Quiz created successfully!', quizId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to create quiz.' });
  } finally {
    conn.release();
  }
};

exports.updateQuiz = async (req, res) => {
  const { id } = req.params;
  // ... update quiz logic ...
  res.json({ message: `Quiz ${id} updated.` });
};

exports.deleteQuiz = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM quizzes WHERE id = ?', [id]);
    res.json({ message: `Quiz ${id} deleted.` });
  } catch (err) {
    console.error('Error deleting quiz:', err);
    res.status(500).json({ error: 'Failed to delete quiz.' });
  }
};

exports.submitQuiz = async (req, res) => {
  // ...submit quiz logic (not implemented here)...
  res.json({ message: 'Quiz submitted.' });
};

exports.gradeQuiz = async (req, res) => {
  // ...grade quiz logic (not implemented here)...
  res.json({ message: 'Quiz graded.' });
};
