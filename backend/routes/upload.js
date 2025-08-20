const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload routes
router.post('/image', auth.verifyToken, upload.single('image'), uploadController.uploadImage);
router.post('/document', auth.verifyToken, upload.single('document'), uploadController.uploadDocument);
router.delete('/:filename', auth.verifyToken, uploadController.deleteFile);

module.exports = router;
