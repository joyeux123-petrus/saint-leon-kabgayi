const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Dashboard routes
router.get('/stats', auth.verifyToken, dashboardController.getDashboardStats);
router.get('/recent-activity', auth.verifyToken, dashboardController.getRecentActivity);
router.get('/upcoming-events', auth.verifyToken, dashboardController.getUpcomingEvents);
router.get('/performance', auth.verifyToken, dashboardController.getPerformanceData);

module.exports = router;
