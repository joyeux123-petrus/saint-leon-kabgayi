const express = require('express');
const router = express.Router();

const notesController = require('../controllers/notesController.js');
const aiTutorController = require('../controllers/aiTutorController.js');
const auth = require('../middleware/auth.js');
const adminAuth = require('../middleware/adminAuth.js'); // Although we'll use auth.requireRole('admin')
const upload = require('../middleware/upload.js');

// Middleware to log user object
const logUser = (req, res, next) => {
    console.log('User object:', req.user);
    next();
};

// Middleware to check if user is teacher or admin for deletion
const isTeacherOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Requires Teacher or Admin role.' });
    }
};

// Notes CRUD
router.post('/', auth.verifyToken, logUser, auth.requireRole('teacher'), upload.array('attachments'), notesController.createNote);
router.get('/', auth.verifyToken, notesController.getNotes);
router.get('/:id', auth.verifyToken, notesController.getNoteById);
router.get('/teacher', auth.verifyToken, notesController.getTeacherNotes);
router.put('/:id', auth.verifyToken, auth.requireRole('teacher'), upload.array('attachments'), notesController.updateNote);
router.delete('/:id', auth.verifyToken, isTeacherOrAdmin, notesController.deleteNote);

// Notes Search
router.get('/search', auth.verifyToken, notesController.searchNotes);

// Annotations
router.post('/:id/annotations', auth.verifyToken, auth.requireRole('student'), notesController.addAnnotation);
router.get('/:id/annotations', auth.verifyToken, notesController.getAnnotations);
router.put('/annotations/:id', auth.verifyToken, auth.requireRole('student'), notesController.updateAnnotation);
router.delete('/annotations/:id', auth.verifyToken, auth.requireRole('student'), notesController.deleteAnnotation);

// Interactions
router.post('/:id/interactions', auth.verifyToken, notesController.trackInteraction);
router.get('/:id/stats', auth.verifyToken, auth.requireRole('teacher'), notesController.getEngagementStats);

// AI Enhancements
router.post('/:id/ai', auth.verifyToken, auth.requireRole('teacher'), notesController.generateAIEnhancements);
router.get('/:id/ai', auth.verifyToken, notesController.getAIEnhancements);

// AI Q&A
router.post('/:id/qna', auth.verifyToken, aiTutorController.handleConversation.bind(aiTutorController));

module.exports = router;
