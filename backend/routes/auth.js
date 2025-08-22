// RUDASUMBWA Auth Routes (Express)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
console.log('DEBUG: authController:', authController);
const rateLimit = require('../middleware/rateLimit');

router.get('/verify-email', authController.verifyEmail);
router.post('/signup', authController.signup);
router.post('/login', rateLimit, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/users/approve/:userId', authController.approve);
router.delete('/users/reject/:userId', authController.reject);
router.get('/users/pending', authController.getPendingUsers);
router.get('/dashboard/stats', authController.getDashboardStats);
router.post('/logout', authController.logout);
router.post('/resend-verification', authController.resendVerificationEmail);

module.exports = router;
