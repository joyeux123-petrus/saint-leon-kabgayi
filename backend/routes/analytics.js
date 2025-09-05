const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Get student engagement data (teacher/admin only)
router.get('/student-engagement', auth.verifyToken, auth.requireRoles(['teacher', 'admin']), analyticsController.getStudentEngagement);

module.exports = router;