const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.post('/secure-panel', adminController.login);

// Admin routes for user management
router.get('/users/pending', adminAuth, adminController.getPendingUsers);
router.patch('/users/:id/approve', adminAuth, adminController.approveUser);
router.delete('/users/:id/reject', adminAuth, adminController.rejectUser);

// Dashboard analytics
router.get('/analytics', adminAuth, adminController.getDashboardAnalytics);

// Full User Management
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/users/:id', adminAuth, adminController.getUserById);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.delete('/users/:id', adminAuth, adminController.deleteUser);

// New route for assigning subjects to teachers
router.post('/users/:teacherId/assign-subjects', adminAuth, adminController.assignSubjectsToTeacher);

// New route for getting assigned subjects for a teacher
router.get('/users/:teacherId/assigned-subjects', adminAuth, adminController.getAssignedSubjectsForTeacher);

module.exports = router;