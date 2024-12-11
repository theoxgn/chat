const ChatService = require('../service/chat.service');
const ErrorResponse = require("../response/error.response");
const SuccessResponse = require("../response/success.response");

class ChatController {
    // TODO: Implement socketio
    async createChatTypingStatus(req, res, next) {
        try {
            console.log('Received typing update:', req.body); // Debug log
            const {roomId, userId, typing} = req.body;
            if (!roomId || !userId) {
                throw new ErrorResponse(400, 'Bad Request', 'Room ID and User ID are required');
            }
            const result = await ChatService.createChatTypingStatus(roomId, userId, typing);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // TODO: Implement socketio
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
            return await SuccessResponse.toJSON(req, res, 201, 'Chat pinned successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async deleteChatPin(req, res, next) {
        try {
            const {userId, roomId} = req.body;
            const result = await ChatService.deleteChatPin(userId, roomId);
            return await SuccessResponse.toJSON(req, res, 200, 'Chat pin deleted successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async getPinnedChats(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await ChatService.getPinnedChats(userId);
            return await SuccessResponse.toJSON(req, res, 200, 'Pinned chats retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async getAllChats(req, res, next) {
        try {
            const {
                userId,
                viewAs,
                searchQuery,
                page,
                size,
            } = req.query;
            const result = await ChatService.getAllChats(userId, viewAs, searchQuery, page, size);
            return await SuccessResponse.toJSON(req, res, 200, 'All chats retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChatController();