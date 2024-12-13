const SuccessResponse = require("../response/success.response");

// * Import Service
const MessageService = require("../service/message.service");

class MessageController {
    async getMessagesByRoomId(req, res, next) {
        try {
            const {roomId} = req.params;
            const result = await MessageService.getMessagesByRoomId(roomId);
            return await SuccessResponse.toJSON(req, res, 200, 'Messages retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async createMessage(req, res, next) {
        try {
            const {roomId, userId, content} = req.body;
            const result = await MessageService.createMessage(roomId, userId, content);
            return await SuccessResponse.toJSON(req, res, 201, 'Message sent successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async readMessage(req, res, next) {
        try {
            const {roomId, userId, messageIds} = req.body;
            const result = await MessageService.readMessage(roomId, userId, messageIds);
            return await SuccessResponse.toJSON(req, res, 200, 'Message read successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async replyMessage(req, res, next) {
        try {
            const {roomId, userId, content, replyTo} = req.body;
            const result = await MessageService.replyMessage(roomId, userId, content, replyTo);
            return await SuccessResponse.toJSON(req, res, 201, 'Message replied successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async getUnreadMessagesCount(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await MessageService.getUnreadMessagesCount(userId);
            return await SuccessResponse.toJSON(req, res, 200, 'Unread messages count retrieved successfully', result);
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
            return await SuccessResponse.toJSON(req, res, 200, 'Message deleted successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async forwardMessage(req, res, next) {
        try {
            const {messageId, targetRoomId, userId} = req.body;
            const result = await MessageService.forwardMessage(messageId, targetRoomId, userId);
            return await SuccessResponse.toJSON(req, res, 200, 'Message forwarded successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async editMessage(req, res, next) {
        try {
            const {messageId} = req.params;
            const {content} = req.body;
            const result = await MessageService.editMessage(messageId, content);
            return await SuccessResponse.toJSON(req, res, 200, 'Message edited successfully', result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MessageController();