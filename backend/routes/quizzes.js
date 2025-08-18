const express = require('express');
const router = express.Router();
const quizzesController = require('../controllers/quizzesController');
const auth = require('../middleware/auth');

// Quiz routes - fixed routes first
router.get('/', quizzesController.getAllQuizzes);
router.post('/', auth, quizzesController.createQuiz);

// Dynamic routes last
router.get('/:id', quizzesController.getQuizById);
router.put('/:id', auth, quizzesController.updateQuiz);
router.delete('/:id', auth, quizzesController.deleteQuiz);
router.post('/:id/submit', auth, quizzesController.submitQuiz);
router.get('/user/:userId', auth, quizzesController.getUserQuizzes);

module.exports = router;
