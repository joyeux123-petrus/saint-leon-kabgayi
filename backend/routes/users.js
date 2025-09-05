const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.js');
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pics'); // Directory to save profile pictures
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

module.exports = (db) => {
  const usersController = require('../controllers/usersController.js')(db);

  // User management routes
  router.get('/', verifyToken, usersController.listUsers);
  router.get('/profile', verifyToken, usersController.profile);
  router.put('/profile/name', verifyToken, usersController.updateUserName);
  router.post('/profile/password', verifyToken, usersController.changePassword);
  router.get('/:userId', verifyToken, usersController.getUserById);
  router.get('/pending', verifyToken, requireRole('admin'), usersController.getPendingUsers);
  router.put('/approve/:userId', verifyToken, requireRole('admin'), usersController.approveUser);
  router.delete('/reject/:userId', verifyToken, requireRole('admin'), usersController.rejectUser);
  router.post('/change-password', express.json(), express.urlencoded({ extended: true }), verifyToken, usersController.changePassword);
  router.post('/upload-profile-pic', verifyToken, upload.single('profilePic'), usersController.uploadProfilePic);

  return router;
};
