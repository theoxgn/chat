const ChatService = require('../service/chat.service');

class ChatController {
    async createChatTypingStatus(req, res, next) {
        try {
            console.log('Received typing update:', req.body); // Debug log
            const {roomId, userId, typing} = req.body;
            const result = await ChatService.createChatTypingStatus(roomId, userId, typing);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getChatTypingStatus(req, res, next) {
        try {
            const roomKey = `room:${req.params.roomId}`;
            const result = await ChatService.getChatTypingStatus(roomKey);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async createChatPin(req, res, next) {
        try {
            const {userId, roomId} = req.body;
            const result = await ChatService.createChatPin(userId, roomId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteChatPin(req, res, next) {
        try {
            const {userId, roomId} = req.body;
            await ChatService.deleteChatPin(userId, roomId);
            res.json({success: true});
        } catch (error) {
            next(error);
        }
    }

    async getPinnedChats(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await ChatService.getPinnedChats(userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChatController();