const express = require('express');
const router = express.Router();
const academicSummaryController = require('../controllers/academicSummaryController');
const auth = require('../middleware/auth');

// Academic summary routes
router.get('/', auth, academicSummaryController.getAcademicSummary);
router.get('/user/:userId', auth, academicSummaryController.getUserAcademicSummary);
router.post('/generate', auth, academicSummaryController.generateSummary);

module.exports = router;
