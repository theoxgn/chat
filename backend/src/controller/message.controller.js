// * Import Service
const MessageService = require("../service/message.service");

class MessageController {
    async getMessagesByRoomId(req, res, next) {
        try {
            const {roomId} = req.params;
            const result = await MessageService.getMessagesByRoomId(roomId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async createMessage(req, res, next) {
        try {
            const {roomId, userId, content} = req.body;
            const result = await MessageService.createMessage(roomId, userId, content);
            res.json(result);

        } catch (error) {
            next(error);
        }
    }

    async readMessage(req, res, next) {
        try {
            const {roomId, userId, messageIds} = req.body;
            const result = await MessageService.readMessage(roomId, userId, messageIds);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getUnreadMessagesCount(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await MessageService.getUnreadMessagesCount(userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async searchMessageInRoom(req, res, next) {
        try {
            const roomId = parseInt(req.params.roomId);
            const searchQuery = req.query.query;

            // Input validation
            if (isNaN(roomId) || !searchQuery) {
                return res.status(400).json({
                    error: 'Valid room ID and search query are required'
                });
            }

            const result = await MessageService.searchMessageInRoom(roomId, searchQuery);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteMessage(req, res, next) {
        try {
            const {messageId} = req.params;
            const result = await MessageService.deleteMessage(messageId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async forwardMessage(req, res, next) {
        try {
            const {messageId, targetRoomId, userId} = req.body;
            const result = await MessageService.forwardMessage(messageId, targetRoomId, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MessageController();