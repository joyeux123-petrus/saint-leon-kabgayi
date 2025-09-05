const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const engagementController = require('../controllers/engagementController');
const { verifyToken } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Submit engagement metrics for an attempt
router.post('/:attempt_id', verifyToken, engagementController.submitEngagementMetrics);

// View engagement metrics for an attempt (teacher dashboard)
router.get('/:attempt_id', verifyToken, adminAuth, engagementController.getEngagementMetrics);

module.exports = router;