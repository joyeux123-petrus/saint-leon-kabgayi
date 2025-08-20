const express = require('express');
const router = express.Router();
const subjectsController = require('../controllers/subjectsController');
const auth = require('../middleware/auth');

// Subject routes - fixed routes first
router.get('/', subjectsController.getAllSubjects);
router.post('/', auth.verifyToken, subjectsController.createSubject);

// Dynamic routes last
router.get('/:id', subjectsController.getSubjectById);
router.put('/:id', auth.verifyToken, subjectsController.updateSubject);
router.delete('/:id', auth.verifyToken, subjectsController.deleteSubject);

module.exports = router;
