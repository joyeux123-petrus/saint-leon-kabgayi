const express = require('express');
const router = express.Router();
const quizzesController = require('../controllers/quizzesController');
const auth = require('../middleware/auth');

// Quiz routes
router.get('/', quizzesController.listQuizzes);
router.post('/', auth.verifyToken, quizzesController.createQuiz);
router.put('/:id', auth.verifyToken, quizzesController.updateQuiz);
router.delete('/:id', auth.verifyToken, quizzesController.deleteQuiz);
router.post('/:id/submit', auth.verifyToken, quizzesController.submitQuiz);

module.exports = router;
