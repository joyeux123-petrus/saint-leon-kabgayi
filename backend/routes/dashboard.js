const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Dashboard routes
router.get('/stats', auth, dashboardController.getDashboardStats);
router.get('/recent-activity', auth, dashboardController.getRecentActivity);
router.get('/upcoming-events', auth, dashboardController.getUpcomingEvents);
router.get('/performance', auth, dashboardController.getPerformanceData);

module.exports = router;
