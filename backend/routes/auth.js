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
router.get('/approve', authController.approve);
router.get('/reject', authController.reject);
router.post('/logout', authController.logout);
router.post('/resend-verification', authController.resendVerificationEmail);

module.exports = router;
