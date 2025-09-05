const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const announcementsController = require('../controllers/announcementsController.js');
const auth = require('../middleware/auth.js');
const adminAuth = require('../middleware/adminAuth.js');

// Announcement routes - fixed routes first
router.get('/', announcementsController.getAllAnnouncements);
router.post('/', adminAuth, announcementsController.createAnnouncement);

// Dynamic routes last
router.get('/:id', announcementsController.getAnnouncementById);
router.put('/:id', adminAuth, announcementsController.updateAnnouncement);
router.delete('/:id', adminAuth, announcementsController.deleteAnnouncement);

module.exports = router;
