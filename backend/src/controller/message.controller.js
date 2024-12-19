const SuccessResponse = require("../response/success.response");

// * Import Service
const MessageService = require("../service/message.service");

class MessageController {
    async getMessagesByRoomId(req, res, next) {
        try {
            const {roomId} = req.params;
            const {page, size} = req.query;
            const result = await MessageService.getMessagesByRoomId(roomId, page, size);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async createMessage(req, res, next) {
        try {
            const {roomId, userId, content} = req.body;
            const result = await MessageService.createMessage(roomId, userId, content);
            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async readMessage(req, res, next) {
        try {
            const {roomId, userId, messageIds} = req.body;
            const result = await MessageService.readMessage(roomId, userId, messageIds);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async replyMessage(req, res, next) {
        try {
            const {roomId, userId, content, replyTo} = req.body;
            const result = await MessageService.replyMessage(roomId, userId, content, replyTo);
            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async getUnreadMessagesCount(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await MessageService.getUnreadMessagesCount(userId);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
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
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async deleteMessage(req, res, next) {
        try {
            const {messageId} = req.params;
            const result = await MessageService.deleteMessage(messageId);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async forwardMessage(req, res, next) {
        try {
            const {messageId, targetRoomId, userId} = req.body;
            const result = await MessageService.forwardMessage(messageId, targetRoomId, userId);
            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async editMessage(req, res, next) {
        try {
            const {messageId} = req.params;
            const {content} = req.body;
            const result = await MessageService.editMessage(messageId, content);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async createInformationMessage(req, res, next) {
        try {
            const {userId, informationType, newData} = req.body;
            const result = await MessageService.createInformationMessage(userId, informationType, newData);
            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MessageController();