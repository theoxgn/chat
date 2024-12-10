const pool = require("../config/postgres");
const {io} = require("../application/app");
const {Message, User} = require("../../models");
const {Op, fn, col} = require("sequelize");

class MessageService {
    async getMessagesByRoomId(roomId) {
        // * Find messages by room ID
        const messages = await Message.findAll({
            where: {
                chatRoomId: roomId
            },
            include: [{model: User, as: 'sender', attributes: ['id']}],
            order: [['created_at', 'ASC']],
            paranoid: false
        });

        return messages.map(message => {
            if (message.deleted_at) {
                message.content = 'This message was deleted';
            }
            return message;
        });
    }

    async createMessage(roomId, userId, content) {
        // * Create message in database
        return await Message.create({
            chatRoomId: roomId,
            senderId: userId,
            content: content,
            messageType: 'text',
            status: 'sent'
        });
    }

    async readMessage(roomId, userId, messageIds) {
        // * Update read status in database
        const updated = await Message.update(
            {status: "read", readAt: new Date()},
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

    async getUnreadMessagesCount(userId) {
        return await Message.findAll({
            where: {
                senderId: {[Op.ne]: userId},
                status: 'sent'
            },
            attributes: ['chatRoomId', [fn('COUNT', col('id')), 'count']],
            group: ['chatRoomId']
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
        const result = await Message.create({
            chatRoomId: targetRoomId,
            senderId: userId,
            content: originalMessage.content,
            messageType: 'text',
            status: 'sent',
            isForwarded: true,
            originalMessageId: messageId
        });

        return result;
    }


}

module.exports = new MessageService();