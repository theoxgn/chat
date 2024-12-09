const {Router} = require('express');

// * Create a new router
const chatRouter = Router();

// * Import controller
const ChatController = require('../controller/chat.controller');

chatRouter.post('/api/typing', ChatController.createChatTypingStatus);
chatRouter.get('/api/typing/:roomId', ChatController.getChatTypingStatus);
chatRouter.post('/api/chats/pin', ChatController.createChatPin);
chatRouter.delete('/api/chats/pin', ChatController.deleteChatPin);
chatRouter.get('/api/chats/pin/:userId', ChatController.getPinnedChats);

// Export the router
module.exports = chatRouter;
