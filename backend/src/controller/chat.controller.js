const ResponseError = require("../response/error.response");
const SuccessResponse = require("../response/success.response");

// * Import Service
const ChatService = require('../service/chat.service');
const UserService = require('../service/user.service');

class ChatController {
    // * Already implement socket.io (see in app.js)
    async createChatTypingStatus(req, res, next) {
        try {
            console.log('Received typing update:', req.body); // Debug log
            const {roomId, userId, typing} = req.body;
            if (!roomId || !userId) {
                throw new ResponseError(400, 'Room ID and User ID are required');
            }
            const result = await ChatService.createChatTypingStatus(roomId, userId, typing);
            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    // * Already implement socket.io (see in app.js)
    async getChatTypingStatus(req, res, next) {
        try {
            const roomKey = `room:${req.params.roomId}`;
            const result = await ChatService.getChatTypingStatus(roomKey);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async createChatPin(req, res, next) {
        try {
            const {userId, roomId} = req.body;
            const result = await ChatService.createChatPin(userId, roomId);
            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async deleteChatPin(req, res, next) {
        try {
            const {userId, roomId} = req.body;
            const result = await ChatService.deleteChatPin(userId, roomId);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async getPinnedChats(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await ChatService.getPinnedChats(userId);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async getAllChats(req, res, next) {
        try {
            const {
                userId,
                viewAs,
                subMenuId,
                isAll,
                groupBy,
                page,
                size,
            } = req.query;
            if (groupBy === "category") {
                const result = await ChatService.getAllChatsViewCategory(userId, viewAs, subMenuId, isAll, page, size);
                return await SuccessResponse.showMessage(200, {
                    Data: result,
                    Type: req.originalUrl,
                }, true, res);
            } else if (groupBy === "user") {
                const result = await ChatService.getAllChatsViewUser(userId, viewAs, subMenuId, isAll, page, size);
                return await SuccessResponse.showMessage(200, {
                    Data: result,
                    Type: req.originalUrl,
                }, true, res);
            } else {
                throw new ResponseError(400, 'Invalid groupBy parameter');
            }
        } catch (error) {
            next(error);
        }
    }

    async searchChatsUserOrMessage(req, res, next) {
        try {
            const {searchTerm, viewAs, subMenuId, currentUserId} = req.query;
            const usersResult = await UserService.getAllConnectedUsers(searchTerm, viewAs, subMenuId, currentUserId);
            const chatsResult = await ChatService.searchChatsByMessage(searchTerm, viewAs, subMenuId, currentUserId);
            return await SuccessResponse.showMessage(200, {
                Data: {
                    users: usersResult,
                    chats: chatsResult,
                },
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChatController();