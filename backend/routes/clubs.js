const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const clubsController = require('../controllers/clubsController');
const auth = require('../middleware/auth');

// Club routes - fixed routes first
router.get('/', clubsController.listClubs);
router.post('/', auth.verifyToken, clubsController.createClub);

// Dynamic routes last
router.get('/:id', clubsController.getClubById);
router.put('/:id', auth.verifyToken, clubsController.updateClub);
router.delete('/:id', auth.verifyToken, clubsController.deleteClub);
router.post('/:id/join', auth.verifyToken, clubsController.joinClub);
router.post('/:id/leave', auth.verifyToken, clubsController.leaveClub);

module.exports = router;
