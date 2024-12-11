const typingUsers = require("../store/typingUsers.store")
const {PinnedChat, User, ChatRoom, Message} = require("../../models");
const {Op, Sequelize} = require("sequelize");
const ChatRole = require("../enums/chat.role");

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
        return await PinnedChat.findAll({
            where: {
                userId: userId
            },
            order: [['createdAt', 'DESC']]
        });
    }

    async getAllChats(userId, viewAs, searchQuery, page, size) {
        // * Define pagination
        const offset = page * size;
        const limit = size;
        let oppositeRole = null;

        // * Determine oposite role
        switch (viewAs) {
            // ? If view as buyer, show the sellers
            case ChatRole.BUYER:
                oppositeRole = ChatRole.SELLER;
                break;
            // ? If view as seller, show the buyers
            case ChatRole.SELLER:
                oppositeRole = ChatRole.BUYER;
                break;
            // ? If view as shipper, show the transporters
            case ChatRole.SHIPPER:
                oppositeRole = ChatRole.TRANSPORTER;
                break;
            // ? If view as transporter, show the shippers
            case ChatRole.TRANSPORTER:
                oppositeRole = ChatRole.SHIPPER;
                break;

        }

        // * Find chat (represent chatroom) by userId
        // * Viewer is role of user in chatroom
        // * Opposite is role of other user in chatroom
        const chats = await ChatRoom.findAll({
            include: [
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    attributes: ['content', 'createdAt'],
                    order: [['createdAt', 'DESC']],
                }
            ],
            where: {
                [Op.and]: [
                    // User must be either recipient or initiator
                    {
                        [Op.or]: [
                            {recipient: userId},
                            {initiator: userId}
                        ]
                    },
                    // The other person must have the opposite role
                    {
                        [Op.or]: [
                            // If user is recipient, check initiatorRole
                            {
                                [Op.and]: [
                                    {recipient: userId},
                                    {initiatorRole: oppositeRole}
                                ]
                            },
                            // If user is initiator, check recipientRole
                            {
                                [Op.and]: [
                                    {initiator: userId},
                                    {recipientRole: oppositeRole}
                                ]
                            }
                        ]
                    }
                ]
            },
            subQuery: false,
            order: [[Sequelize.literal('(SELECT MAX("created_at") FROM "Messages" WHERE "Messages"."chat_room_id" = "ChatRoom"."id")'), 'DESC NULLS LAST']]
        });
        return chats
    }
}

module.exports = new ChatService();