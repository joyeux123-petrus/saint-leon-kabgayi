const express = require('express');
const router = express.Router();
const mynotesController = require('../controllers/mynotesController');

// GET all notes for a teacher
router.get('/', mynotesController.getAllNotes);

// POST a new note
router.post('/', mynotesController.createNote);

// PUT to update a note
router.put('/:id', mynotesController.updateNote);

// DELETE a note
router.delete('/:id', mynotesController.deleteNote);

// GET student progress for a note
router.get('/:id/progress', mynotesController.getStudentProgress);

// POST to generate AI summary
router.post('/:id/generate-summary', mynotesController.generateAISummary);

// GET feedback for a note
router.get('/:id/feedback', mynotesController.getFeedback);

// POST feedback for a note
router.post('/:id/feedback', mynotesController.addFeedback);

// GET concept map for a note
router.get('/:id/concept-map', mynotesController.getConceptMap);

// POST concept map for a note
router.post('/:id/concept-map', mynotesController.createConceptMap);

module.exports = router;
