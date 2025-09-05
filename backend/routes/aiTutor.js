const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const aiTutorController = require('../controllers/aiTutorController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.verifyToken);

// Main conversation endpoint
router.post('/conversation', (req, res) => {
    aiTutorController.handleConversation(req, res);
});

// Generate specific lesson
router.post('/lesson', (req, res) => {
    aiTutorController.generateLesson(req, res);
});

// Generate quiz for a lesson
router.post('/quiz', (req, res) => {
    aiTutorController.generateQuiz(req, res);
});

// Submit quiz answers
router.post('/quiz/submit', (req, res) => {
    aiTutorController.submitQuiz(req, res);
});

// Get conversation history
router.get('/history', (req, res) => {
    aiTutorController.getConversationHistory(req, res);
});

// Get learning progress
router.get('/progress', (req, res) => {
    aiTutorController.getLearningProgress(req, res);
});

// Clear conversation history
router.delete('/history', (req, res) => {
    aiTutorController.clearHistory(req, res);
});

module.exports = router;
