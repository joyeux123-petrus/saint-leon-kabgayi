const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

// Get enrolled courses for the authenticated student
router.get('/enrolled', auth.verifyToken, coursesController.getEnrolledCourses);

// Get courses to explore for the authenticated student
router.get('/explore', auth.verifyToken, coursesController.getExploreCourses);

module.exports = router;