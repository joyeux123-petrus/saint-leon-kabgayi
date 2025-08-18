const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

// Notes routes - fixed routes first
router.get('/', auth, notesController.getAllNotes);
router.post('/', auth, notesController.createNote);

// Dynamic routes last
router.get('/:id', auth, notesController.getNoteById);
router.put('/:id', auth, notesController.updateNote);
router.delete('/:id', auth, notesController.deleteNote);
router.get('/user/:userId', auth, notesController.getUserNotes);

module.exports = router;
