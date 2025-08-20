const express = require('express');
const router = express.Router();
const gospelController = require('../controllers/gospelController');

// Gospel routes - public access
router.get('/', gospelController.getGospelOfTheDay);


module.exports = router;
