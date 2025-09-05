const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const eventsController = require('../controllers/eventsController.js');
const auth = require('../middleware/auth.js');

// Events routes - fixed routes first
router.get('/', eventsController.getAllEvents);
router.post('/', auth.verifyToken, eventsController.createEvent);

// Dynamic routes last
router.get('/:id', eventsController.getEventById);
router.put('/:id', auth.verifyToken, eventsController.updateEvent);
router.delete('/:id', auth.verifyToken, eventsController.deleteEvent);
router.post('/:id/register', auth.verifyToken, eventsController.registerForEvent);

module.exports = router;
