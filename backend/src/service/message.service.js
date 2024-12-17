const pool = require("../config/postgres");
const {Message, User, ChatRoom, File} = require("../../models");
const {Op, fn, col} = require("sequelize");
const MessageStatus = require("../enums/message.status");
const MessageType = require("../enums/message.type");
const MessageInformationType = require("../enums/message.information.type");

class MessageService {
    async getMessagesByRoomId(roomId, page = 1, size = 10) {
        // * Calculate offset and limit for pagination
        const offset = (page - 1) * size;
        const limit = size;

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
                    paranoid: false,
                    include: [
                        {
                            model: File,
                            as: 'files',
                            attributes: ['id', 'originalName', 'name', 'thumbnailFileUrl', 'fileUrl', 'fileType', 'extension'],
                        }
                    ]
                },
                {
                    model: File,
                    as: 'files',
                    attributes: ['id', 'originalName', 'name', 'thumbnailFileUrl', 'fileUrl', 'fileType', 'extension']
                }
            ],
            order: [['created_at', 'ASC']],
            offset: offset,
            limit: limit,
            paranoid: false
        });

        return messages.map(message => {
            if (message.deletedAt) {
                message.content = 'This message was deleted';
                message.setDataValue('files', []);
            }
            if (message.replyMessage) {
                if (message.replyMessage.deletedAt) {
                    message.replyMessage.content = 'This message was deleted';
                    message.replyMessage.setDataValue('files', []);
                }
            }
            return message;
        });
    }

    async createMessage(roomId, userId, content, files) {
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
        let messageType = MessageType.TEXT;
        if (files) {
            if (files.length > 0) {
                if (files[0].fileType.includes('image')) {
                    messageType = MessageType.IMAGE
                } else if (files[0].fileType.includes('video')) {
                    messageType = MessageType.VIDEO
                } else if (files[0].fileType.includes('pdf') || files[0].fileType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                    messageType = MessageType.DOCUMENT
                }

            }
        }
        const message = await Message.create({
            chatRoomId: roomId,
            senderId: userId,
            content: content,
            messageType: messageType,
            status: MessageStatus.DELIVERED,
            originalInitiatorName: user.username,
            originalRecipientName: room.recipientUser.username
        });

        // * Create file in database
        if (files) {
            if (files.length > 0) {
                await File.create({
                    messageId: message.id,
                    originalName: files[0].fileOriginalName,
                    name: files[0].fileName,
                    thumbnailFileUrl: files[0].fileUrl,
                    fileUrl: files[0].fileUrl,
                    fileType: files[0].fileType,
                    extension: files[0].fileExtension, // Remove the dot
                });
            }
        }

        return await Message.findByPk(message.id, {
            include: [
                {
                    model: File,
                    as: 'files',
                    attributes: ['id', 'originalName', 'name', 'thumbnailFileUrl', 'fileUrl', 'fileType', 'extension']
                }
            ]
        })
    }

    async readMessage(roomId, userId, messageIds) {
        // * Update read status in database
        const updated = await Message.update(
            {status: MessageStatus.READ, readAt: new Date()},
            {where: {id: messageIds, senderId: {[Op.ne]: userId}}}
        );

        // Emit read receipt event
        // if (io) {
        //     io.to(roomId).emit('messages_read', {
        //         roomId,
        //         userId,
        //         messageIds,
        //         readAt: new Date()
        //     });
        // }
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
        const message = await Message.create({
            chatRoomId: roomId,
            senderId: userId,
            content: content,
            messageType: MessageType.TEXT,
            status: MessageStatus.DELIVERED,
            replyTo: replyTo,
            originalInitiatorName: user.username,
            originalRecipientName: room.recipientUser.username
        });

        // Then fetch with the association
        const messageWithReply = await Message.findByPk(message.id, {
            include: [
                {
                    model: Message,
                    as: 'replyMessage',
                    attributes: ['id', 'content', 'originalInitiatorName', 'originalRecipientName', "deletedAt"],
                    paranoid: false,
                    include: [
                        {
                            model: File,
                            as: 'files',
                            attributes: ['id', 'originalName', 'name', 'thumbnailFileUrl', 'fileUrl', 'fileType', 'extension'],
                        }
                    ]
                },
            ]
        });

        if (messageWithReply.deletedAt) {
            messageWithReply.content = 'This message was deleted';
        }
        if (messageWithReply.replyMessage) {
            if (messageWithReply.replyMessage.deletedAt) {
                messageWithReply.replyMessage.content = 'This message was deleted';
            }
        }
        return messageWithReply;
    }

    async getUnreadMessagesCount(userId) {
        return await Message.findAll({
            where: {
                senderId: {[Op.ne]: userId},
                status: {
                    [Op.or]: [MessageStatus.DELIVERED, MessageStatus.READ]
                }
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
        await Message.destroy({
            where: {
                id: messageId
            }
        });
        const deleted = await Message.findByPk(messageId, {paranoid: false});
        deleted.content = 'This message was deleted';
        return deleted;
    }

    async forwardMessage(messageId, targetRoomId, userId) {
        // * Find original message
        const originalMessage = await Message.findByPk(messageId, {
            include: [
                {
                    model: File,
                    as: 'files',
                    attributes: ['id', 'originalName', 'name', 'thumbnailFileUrl', 'fileUrl', 'fileType', 'extension']
                }
            ]
        });

        if (!originalMessage) {
            throw new Error('Original message not found');
        }

        // * Create forwarded message
        let messageType = MessageType.TEXT;
        if (originalMessage.files) {
            if (originalMessage.files.length > 0) {
                if (originalMessage.files[0].fileType.includes('image')) {
                    messageType = MessageType.IMAGE
                } else if (originalMessage.files[0].fileType.includes('video')) {
                    messageType = MessageType.VIDEO
                } else if (originalMessage.files[0].fileType.includes('pdf') || originalMessage.files[0].fileType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                    messageType = MessageType.DOCUMENT
                }
            }
        }
        const message = await Message.create({
            chatRoomId: targetRoomId,
            senderId: userId,
            content: originalMessage.content,
            messageType: messageType,
            status: MessageStatus.DELIVERED,
            isForwarded: true,
            originalMessageId: messageId
        });

        // * Create file in database
        if (originalMessage.files) {
            if (originalMessage.files.length > 0) {
                await File.create({
                    messageId: message.id,
                    originalName: originalMessage.files[0].originalName,
                    name: originalMessage.files[0].name,
                    thumbnailFileUrl: originalMessage.files[0].thumbnailFileUrl,
                    fileUrl: originalMessage.files[0].fileUrl,
                    fileType: originalMessage.files[0].fileType,
                    extension: originalMessage.files[0].extension
                });
            }
        }

        return await Message.findByPk(message.id, {
            include: [
                {
                    model: File,
                    as: 'files',
                    attributes: ['id', 'originalName', 'name', 'thumbnailFileUrl', 'fileUrl', 'fileType', 'extension']
                }
            ]
        });
    }

    async editMessage(messageId, content) {
        // * Find message
        const message = await Message.findByPk(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        // * Update message
        await message.update({
            content,
            isUpdated: true
        });

        return await Message.findByPk(messageId, {
            include: [
                {
                    model: File,
                    as: 'files',
                    attributes: ['id', 'originalName', 'name', 'thumbnailFileUrl', 'fileUrl', 'fileType', 'extension']
                }
            ]
        });
    }

    async createInformationMessage(userId, informationType, newData) {
        // * Validate user
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // * Fetch all rooms of user
        const rooms = await ChatRoom.findAll({
            where: {
                [Op.or]: [
                    {initiator: userId}
                ]
            }
        });

        // * Create content based on information type
        let content = '';
        switch (informationType) {
            case MessageInformationType.NAME_CHANGED:
                content = `${user.username} telah mengubah nama menjadi ${newData}`;
                break;

        }

        // * Create information message for each room
        const messages = rooms.map(room => ({
            chatRoomId: room.id,
            senderId: userId,
            content: content,
            messageType: MessageType.TEXT,
            isInformation: true,
            status: MessageStatus.DELIVERED,
            originalInitiatorName: user.username,
            originalRecipientName: null
        }));

        return await Message.bulkCreate(messages);
    }
}

module.exports = new MessageService();