const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

// Notes routes - fixed routes first
router.post('/summarize', auth.verifyToken, notesController.summarizeNote);

// Dynamic routes last
router.get('/', auth.verifyToken, notesController.getAllNotes);
router.post('/', auth.verifyToken, notesController.createNote);

router.get('/:id', auth.verifyToken, notesController.getNoteById);
router.put('/:id', auth.verifyToken, notesController.updateNote);
router.delete('/:id', auth.verifyToken, notesController.deleteNote);
router.get('/user/:userId', auth.verifyToken, notesController.getUserNotes);

module.exports = router;

