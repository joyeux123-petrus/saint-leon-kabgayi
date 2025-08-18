const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const auth = require('../middleware/auth');

// Message routes - fixed routes first
router.get('/', auth, messagesController.getAllMessages);
router.post('/', auth, messagesController.createMessage);

// Dynamic routes last
router.get('/:id', auth, messagesController.getMessageById);
router.put('/:id', auth, messagesController.updateMessage);
router.delete('/:id', auth, messagesController.deleteMessage);
router.get('/conversation/:userId', auth, messagesController.getConversation);

module.exports = router;
