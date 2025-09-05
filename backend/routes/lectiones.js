const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const lectionesController = require('../controllers/lectionesController');

// List lectiones
router.get('/', lectionesController.listLectiones);
// Create lectiones (teacher)
router.post('/', lectionesController.createLectiones);
// Get single lectiones
router.get('/:id', lectionesController.getLectiones);

module.exports = router;
