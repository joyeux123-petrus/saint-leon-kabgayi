const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const auth = require('../middleware/auth');

// Events routes - fixed routes first
router.get('/', eventsController.getAllEvents);
router.post('/', auth, eventsController.createEvent);

// Dynamic routes last
router.get('/:id', eventsController.getEventById);
router.put('/:id', auth, eventsController.updateEvent);
router.delete('/:id', auth, eventsController.deleteEvent);
router.post('/:id/register', auth, eventsController.registerForEvent);

module.exports = router;
