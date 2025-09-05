const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const quizzesController = require('../controllers/quizzesController.js');
const quizAttemptController = require('../controllers/quizAttemptController.js');
const quizResultsController = require('../controllers/quizResultsController.js');
const auth = require('../middleware/auth.js');

// Quiz Management Routes
// Create a new quiz (teacher/admin)
router.post('/', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizzesController.createQuiz);

// List quizzes (filter by subject/class) (all authenticated users)
router.get('/', auth.verifyToken, quizzesController.getQuizzes);

// Get quizzes created by the authenticated teacher
router.get('/teacher', auth.verifyToken, auth.requireRole('teacher'), quizzesController.getTeacherQuizzes);

// Get quiz details including questions & options (all authenticated users)
router.get('/:quiz_id', auth.verifyToken, quizzesController.getQuizDetails);

// Get quiz details by note_id (all authenticated users)
router.get('/by-note/:note_id', auth.verifyToken, quizzesController.getQuizByNoteId);

// Update quiz (teacher/admin)
router.patch('/:quiz_id', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizzesController.updateQuiz);

// Delete quiz (admin/teacher)
router.delete('/:quiz_id', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizzesController.deleteQuiz);

// Quiz Attempt / Submission Routes
// Start a quiz attempt
router.post('/:quiz_id/start', auth.verifyToken, quizAttemptController.startQuizAttempt);

// Submit answers for a quiz attempt
router.post('/attempts/:attempt_id/submit', auth.verifyToken, quizAttemptController.submitAnswers);

// Get results/feedback for a quiz attempt (for student to view their own results)
router.get('/attempts/:attempt_id', auth.verifyToken, quizAttemptController.getAttemptResults);

// Quiz Results Management Routes (for Teachers/Admins)
// Get all quiz attempts for quizzes created by the teacher
router.get('/attempts/teacher', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizResultsController.getTeacherQuizAttempts);

// Get all quiz attempts for a specific quiz (created by the teacher)
router.get('/:quizId/attempts', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizResultsController.getQuizAttemptsByQuizId);

// Get all quiz attempts for quizzes created by the teacher that need manual grading
router.get('/attempts/teacher/pending-review', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizResultsController.getTeacherPendingReviewAttempts);

// Get details of a specific quiz attempt (for teacher to view)
router.get('/attempts/:attempt_id/details', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizResultsController.getQuizAttemptDetails);

// Update teacher feedback for a student answer
router.patch('/attempts/answers/:student_answer_id/feedback', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizResultsController.updateTeacherFeedback);

// Update teacher feedback and score for a student answer
router.patch('/attempts/answers/:student_answer_id/grade', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), quizResultsController.gradeStudentAnswer);

// Student-specific quiz attempts
router.get('/attempts/student', auth.verifyToken, quizAttemptController.getStudentQuizAttempts);

module.exports = router;
