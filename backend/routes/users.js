const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');

// User management routes
router.get('/', auth.verifyToken, usersController.listUsers);
router.get('/profile', auth.verifyToken, usersController.profile);
router.get('/:userId', auth.verifyToken, usersController.getUserById);
router.get('/pending', auth.verifyToken, auth.requireRole('admin'), usersController.getPendingUsers);
router.put('/approve/:userId', auth.verifyToken, auth.requireRole('admin'), usersController.approveUser);
router.delete('/reject/:userId', auth.verifyToken, auth.requireRole('admin'), usersController.rejectUser);

module.exports = router;
