const {Router} = require('express');
const messagesRouter = Router();

// * Import controller
const MessageController = require('../controller/message.controller');

// * Messages endpoint
messagesRouter.get('/api/messages/:roomId', MessageController.getMessagesByRoomId);
messagesRouter.post('/api/messages', MessageController.createMessage);
messagesRouter.post('/api/messages/read', MessageController.readMessage);
messagesRouter.post('/api/messages/reply', MessageController.replyMessage);
messagesRouter.get('/api/messages/unread/:userId', MessageController.getUnreadMessagesCount);
messagesRouter.get('/api/messages/search/:roomId', MessageController.searchMessageInRoom);
messagesRouter.delete('/api/messages/:messageId', MessageController.deleteMessage);
messagesRouter.post('/api/messages/forward', MessageController.forwardMessage);

module.exports = messagesRouter;