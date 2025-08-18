const express = require('express');
const router = express.Router();
const clubsController = require('../controllers/clubsController');
const auth = require('../middleware/auth');

// Club routes - fixed routes first
router.get('/', clubsController.getAllClubs);
router.post('/', auth, clubsController.createClub);

// Dynamic routes last
router.get('/:id', clubsController.getClubById);
router.put('/:id', auth, clubsController.updateClub);
router.delete('/:id', auth, clubsController.deleteClub);
router.post('/:id/join', auth, clubsController.joinClub);
router.post('/:id/leave', auth, clubsController.leaveClub);

module.exports = router;
