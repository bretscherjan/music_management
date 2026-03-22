const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { attachIO } = require('../services/websocket.service');

// All chat routes are protected
router.use(authMiddleware);
router.use(attachIO);

router.get('/', chatController.getChats);
router.post('/direct', chatController.createDirectChat);
router.post('/group', chatController.createGroupChat);
router.get('/users/search', chatController.searchUsers);
router.get('/search-entities', chatController.searchEntities);

router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.post('/:chatId/read', chatController.markAsRead);

// Management and Reactions
router.patch('/:chatId', chatController.updateChat);
router.delete('/:chatId', chatController.deleteChat);
router.post('/:chatId/participants', chatController.addParticipants);
router.delete('/:chatId/participants/:userId', chatController.removeParticipant);
router.post('/:chatId/messages/:messageId/react', chatController.toggleReaction);

module.exports = router;
