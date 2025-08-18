const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');

// User management routes - fixed routes first
router.get('/', auth, usersController.getAllUsers);
router.get('/profile', auth, usersController.getProfile);
router.post('/change-password', auth, usersController.changePassword);

// Dynamic routes last
router.get('/:id', auth, usersController.getUserById);
router.put('/profile', auth, usersController.updateProfile);
router.put('/:id', auth, usersController.updateUser);
router.delete('/:id', auth, usersController.deleteUser);

module.exports = router;
