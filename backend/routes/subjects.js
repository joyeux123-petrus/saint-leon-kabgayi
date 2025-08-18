const express = require('express');
const router = express.Router();
const subjectsController = require('../controllers/subjectsController');
const auth = require('../middleware/auth');

// Subject routes - fixed routes first
router.get('/', subjectsController.getAllSubjects);
router.post('/', auth, subjectsController.createSubject);

// Dynamic routes last
router.get('/:id', subjectsController.getSubjectById);
router.put('/:id', auth, subjectsController.updateSubject);
router.delete('/:id', auth, subjectsController.deleteSubject);

module.exports = router;
