// RUDASUMBWA Auth Routes (Express)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/approve', authController.approve);
router.get('/reject', authController.reject);
router.post('/logout', authController.logout);

module.exports = router;
