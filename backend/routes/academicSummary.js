const express = require('express');
const router = express.Router();
const academicSummaryController = require('../controllers/academicSummaryController');
const auth = require('../middleware/auth');

// Academic summary routes
router.get('/', auth.verifyToken, academicSummaryController.getAcademicSummary);
router.get('/user/:userId', auth.verifyToken, academicSummaryController.getUserAcademicSummary);
router.post('/generate', auth.verifyToken, academicSummaryController.generateSummary);

module.exports = router;
