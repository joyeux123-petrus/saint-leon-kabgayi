const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const annotationsController = require('../controllers/annotationsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

router.get('/:noteId', annotationsController.getAnnotationsForNote);
router.post('/', annotationsController.createAnnotation);
router.delete('/:annotationId', annotationsController.deleteAnnotation);

module.exports = router;
