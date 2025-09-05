const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// Dashboard stats for the main dashboard view
router.get('/', verifyToken, dashboardController.getDashboardStats);

module.exports = router;