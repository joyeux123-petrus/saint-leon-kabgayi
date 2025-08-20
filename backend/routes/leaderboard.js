const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

// Leaderboard routes
router.get('/', leaderboardController.getLeaderboard);
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);
router.get('/monthly', leaderboardController.getMonthlyLeaderboard);
router.get('/user/:userId', auth.verifyToken, leaderboardController.getUserRank);

module.exports = router;
