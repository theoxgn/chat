const pool = require("../config/postgres");
const {io} = require("../application/app");
const {Message, User, ChatRoom} = require("../../models");
const {Op, fn, col} = require("sequelize");
const MessageStatus = require("../enums/message.status");
const MessageType = require("../enums/message.type");

class MessageService {
    async getMessagesByRoomId(roomId) {
        // * Find messages by room ID
        const messages = await Message.findAll({
            where: {
                chatRoomId: roomId
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id']
                },
                {
                    model: Message,
                    as: 'replyMessage',
                    attributes: ['id', 'content', 'originalInitiatorName', 'originalRecipientName', "deletedAt"],
                    paranoid: false
                }
            ],
            order: [['created_at', 'ASC']],
            paranoid: false
        });

        return messages.map(message => {
            if (message.deletedAt) {
                message.content = 'This message was deleted';
            }
            if (message.replyMessage) {
                if (message.replyMessage.deletedAt) {
                    message.replyMessage.content = 'This message was deleted';
                }
            }
            return message;
        });
    }

    async createMessage(roomId, userId, content) {
        // * Validate user and room
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const room = await ChatRoom.findByPk(
            roomId,
            {
                include: [
                    {
                        model: User,
                        as: 'recipientUser'
                    }
                ]
            }
        );

        if (!room) {
            throw new Error('Room not found');
        }

        // * Create message in database
        return await Message.create({
            chatRoomId: roomId,
            senderId: userId,
            content: content,
            messageType: MessageType.TEXT,
            status: MessageStatus.DELIVERED,
            originalInitiatorName: user.username,
            originalRecipientName: room.recipientUser.username
        });
    }

    async readMessage(roomId, userId, messageIds) {
        // * Update read status in database
        const updated = await Message.update(
            {status: MessageStatus.READ, readAt: new Date()},
            {where: {id: messageIds, senderId: {[Op.ne]: userId}}}
        );

        // Emit read receipt event
        if (io) {
            io.to(roomId).emit('messages_read', {
                roomId,
                userId,
                messageIds,
                readAt: new Date()
            });
        }
        return updated;
    }

    async replyMessage(roomId, userId, content, replyTo) {
        console.log(roomId, userId, content, replyTo)
        // * Validate user and room
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const room = await ChatRoom.findByPk(
            roomId,
            {
                include: [
                    {
                        model: User,
                        as: 'recipientUser'
                    }
                ]
            }
        );

        if (!room) {
            throw new Error('Room not found');
        }

        // * Find original message
        const originalMessage = await Message.findByPk(replyTo);
        if (!originalMessage) {
            throw new Error('Original message not found');
        }

        // * Create reply message
        return await Message.create({
            chatRoomId: roomId,
            senderId: userId,
            content: content,
            messageType: MessageType.TEXT,
            status: MessageStatus.DELIVERED,
            replyTo: replyTo,
            originalInitiatorName: user.username,
            originalRecipientName: room.recipientUser.username
        });
    }

    async getUnreadMessagesCount(userId) {
        return await Message.findAll({
            where: {
                senderId: {[Op.ne]: userId},
                status: 'sent'
            },
            attributes: ['chatRoomId', [fn('COUNT', col('id')), 'count']],
            group: ['chatRoomId'],
            paranoid: false
        });
    }

    async searchMessageInRoom(roomId, searchQuery) {
        const result = await pool.query(
            `SELECT m.*, u.username
             FROM messages m
                      JOIN users u ON m.user_id = u.id
             WHERE m.room_id = $1
               AND LOWER(m.content) LIKE LOWER($2)
             ORDER BY m.created_at DESC`,
            [roomId, `%${searchQuery}%`]
        );

        // Group results by date for better organization
        const groupedResults = result.rows.reduce((acc, message) => {
            const date = new Date(message.created_at).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(message);
            return acc;
        }, {});

        return {
            totalResults: result.rows.length,
            groupedResults
        };
    }

    async deleteMessage(messageId) {
        return await Message.destroy({
            where: {
                id: messageId
            }
        });
    }

    async forwardMessage(messageId, targetRoomId, userId) {
        // * Find original message
        const originalMessage = await Message.findByPk(messageId);
        if (!originalMessage) {
            throw new Error('Original message not found');
        }

        // * Create forwarded message
        return await Message.create({
            chatRoomId: targetRoomId,
            senderId: userId,
            content: originalMessage.content,
            messageType: 'text',
            status: 'sent',
            isForwarded: true,
            originalMessageId: messageId
        });
    }
}

module.exports = new MessageService();