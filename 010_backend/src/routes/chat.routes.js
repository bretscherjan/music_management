const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
const { attachIO } = require('../services/websocket.service');

// All chat routes are protected
router.use(authMiddleware);
router.use(attachIO);

router.get('/', permissionCheck('chat:read'), chatController.getChats);
router.post('/direct', permissionCheck('chat:create'), chatController.createDirectChat);
router.post('/group', permissionCheck('chat:create'), chatController.createGroupChat);
router.get('/users/search', permissionCheck('chat:create'), chatController.searchUsers);
router.get('/search-entities', permissionCheck('chat:create'), chatController.searchEntities);

router.get('/:chatId/messages', permissionCheck('chat:read'), chatController.getMessages);
router.post('/:chatId/messages', permissionCheck('chat:read'), chatController.sendMessage);
router.post('/:chatId/read', permissionCheck('chat:read'), chatController.markAsRead);

// Management and Reactions
router.patch('/:chatId', permissionCheck('chat:create'), chatController.updateChat);
router.delete('/:chatId', permissionCheck('chat:create'), chatController.deleteChat);
router.post('/:chatId/participants', permissionCheck('chat:create'), chatController.addParticipants);
router.delete('/:chatId/participants/:userId', permissionCheck('chat:create'), chatController.removeParticipant);
router.post('/:chatId/messages/:messageId/react', permissionCheck('chat:read'), chatController.toggleReaction);

module.exports = router;
