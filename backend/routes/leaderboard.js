const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController.js');
const { verifyToken } = require('../middleware/auth.js');

// Get top performers for a quiz
router.get('/:quiz_id', verifyToken, leaderboardController.getLeaderboardForQuiz);

// Get a student's position
router.get('/student/:id', verifyToken, leaderboardController.getStudentRank);

// Get overall leaderboard
router.get('/overall', verifyToken, leaderboardController.getOverallLeaderboard);

// Generate AI feedback for a student
router.get('/ai-feedback/:studentId', verifyToken, leaderboardController.generateAIFeedback);

// Generate motivational message for a student
router.get('/motivational-message/:studentId', verifyToken, leaderboardController.generateMotivationalMessage);

module.exports = router;
