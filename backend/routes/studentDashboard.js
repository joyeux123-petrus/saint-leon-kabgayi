const express = require('express');
const router = express.Router();
const studentDashboardController = require('../controllers/studentDashboardController');
const { verifyToken } = require('../middleware/auth');

// Get student dashboard stats
router.get('/student-stats', verifyToken, studentDashboardController.getStudentDashboardStats);

// Get student subjects based on their class
router.get("/subjects", verifyToken, studentDashboardController.getStudentSubjects);

module.exports = router;