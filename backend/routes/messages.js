const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const messagesController = require('../controllers/messagesController');
const auth = require('../middleware/auth');

// Message routes - fixed routes first

// Dynamic routes last
router.get('/', auth.verifyToken, messagesController.getAllMessages);
router.post('/', auth.verifyToken, messagesController.createMessage);

router.get('/:id', auth.verifyToken, messagesController.getMessageById);
router.put('/:id', auth.verifyToken, messagesController.updateMessage);
router.delete('/:id', auth.verifyToken, messagesController.deleteMessage);
router.get('/conversation/:userId', auth.verifyToken, messagesController.getConversation);

module.exports = router;
