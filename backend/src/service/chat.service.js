const pool = require("../config/postgres");
const typingUsers = require("../store/typingUsers.store")
const {PinnedChat, User, ChatRoom} = require("../../models");

class ChatService {
    // !! Need To Change with Socketio
    async createChatTypingStatus(roomId, userId, typing) {
        const roomKey = `room:${roomId}`;
        let roomTyping = typingUsers.get(roomKey) || new Set();

        if (typing) {
            roomTyping.add(userId);
        } else {
            roomTyping.delete(userId);
        }

        typingUsers.set(roomKey, roomTyping);

        // Auto-remove typing status after 3 seconds
        setTimeout(() => {
            const currentRoom = typingUsers.get(roomKey);
            if (currentRoom) {
                currentRoom.delete(userId);
                if (currentRoom.size === 0) {
                    typingUsers.delete(roomKey);
                } else {
                    typingUsers.set(roomKey, currentRoom);
                }
            }
        }, 3000);

        return {
            success: true,
            typingUsers: Array.from(roomTyping)
        };

    }

    // !! Need To Change with Socketio
    async getChatTypingStatus(roomKey) {
        const roomTyping = typingUsers.get(roomKey) || new Set();
        return {
            typingUsers: Array.from(roomTyping)
        };
    }

    async createChatPin(userId, roomId) {
        // * Validate userId exists
        const user = await User.findByPk(userId);
        if (!user) {
            return {success: false, message: 'User not found'};
        }

        // * Validate roomId exists
        const chatRoom = await ChatRoom.findByPk(roomId);
        if (!chatRoom) {
            return {success: false, message: 'Chat room not found'};
        }

        // * If not exists, create a new pinned chat
        // * If exists, return success
        const pinnedChat = await PinnedChat.findOne({where: {userId: userId, chatRoomId: roomId}});
        if (pinnedChat) {
            return {success: true, result: pinnedChat};
        }
        const result = await PinnedChat.create({
            userId: userId,
            chatRoomId: roomId,
        });
        if (result) {
            return {success: true, result: result};
        } else {
            return {success: false, result: result};
        }
    }

    async deleteChatPin(userId, roomId) {
        // * Validate userId exists
        const user = await User.findByPk(userId);
        if (!user) {
            return {success: false, message: 'User not found'};
        }

        // * Validate roomId exists
        const chatRoom = await ChatRoom.findByPk(roomId);
        if (!chatRoom) {
            return {success: false, message: 'Chat room not found'};
        }

        // * If exists, delete the pinned chat
        // * If not exists, return success
        const pinnedChat = await PinnedChat.findOne({where: {userId: userId, chatRoomId: roomId}});
        if (pinnedChat) {
            await pinnedChat.destroy();
            return {success: true};
        } else {
            return {success: true};
        }
    }

    async getPinnedChats(userId) {
        const result = await PinnedChat.findAll({
            where: {
                userId: userId
            },
            order: [['createdAt', 'DESC']]
        });

        return result;
    }
}

module.exports = new ChatService();