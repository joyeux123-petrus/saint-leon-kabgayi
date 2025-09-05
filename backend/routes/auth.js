const express = require('express');
const rateLimit = require('../middleware/rateLimit.js');

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

module.exports = (db) => {
  const authController = require('../controllers/auth.controller.js')(db);

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

  return router;
};
