const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const subjectsController = require('../controllers/subjectsController.js');
const { verifyToken } = require('../middleware/auth.js');
const adminAuth = require('../middleware/adminAuth.js');

// Admin-only routes
router.post('/', adminAuth, subjectsController.createSubject);
router.put('/:id', adminAuth, subjectsController.updateSubject);
router.delete('/:id', adminAuth, subjectsController.deleteSubject);

// Authenticated user routes (students, teachers, admins)
router.get('/', verifyToken, subjectsController.getAllSubjects);
router.get('/:id', verifyToken, subjectsController.getSubjectById);

module.exports = router;
