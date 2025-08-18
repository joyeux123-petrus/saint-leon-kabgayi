const express = require('express');
const router = express.Router();
const announcementsController = require('../controllers/announcementsController');
const auth = require('../middleware/auth');

// Announcement routes - fixed routes first
router.get('/', announcementsController.getAllAnnouncements);
router.post('/', auth, announcementsController.createAnnouncement);

// Dynamic routes last
router.get('/:id', announcementsController.getAnnouncementById);
router.put('/:id', auth, announcementsController.updateAnnouncement);
router.delete('/:id', auth, announcementsController.deleteAnnouncement);

module.exports = router;
