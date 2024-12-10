'use strict';
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        chatRoomId: {
            field: 'chat_room_id',
            type: DataTypes.UUID,
            allowNull: false
        },
        senderId: {
            field: 'sender_id',
            type: DataTypes.UUID,
            allowNull: false
        },
        content: DataTypes.TEXT,
        mediaUrl: {
            field: 'media_url',
            type: DataTypes.STRING,
        },
        messageType: {
            field: 'message_type',
            type: DataTypes.ENUM('text', 'image', 'document', 'link', 'module')
        },
        status: {
            type: DataTypes.ENUM('sent', 'delivered', 'read', 'unsent')
        },
        originalMessageId: {
            type: DataTypes.UUID,
            field: 'original_message_id'
        },
        replyTo: {
            type: DataTypes.UUID,
            field: 'reply_to'
        },
        isForwarded: {
            type: DataTypes.BOOLEAN,
            field: 'is_forwarded'
        },
        isUpdated: {
            type: DataTypes.BOOLEAN,
            field: 'is_updated'
        },
        isInformation: {
            type: DataTypes.BOOLEAN,
            field: 'is_information'
        },
        readAt: {
            type: DataTypes.DATE,
            field: 'read_at'
        },
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            field: 'updated_at',
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        deletedAt: {
            field: 'deleted_at',
            type: DataTypes.DATE
        }
    }, {
        tableName: 'Messages',
        underscored: true,
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
    });

    Message.associate = function (models) {
        // associations can be defined here
        Message.belongsTo(models.ChatRoom, {
            foreignKey: 'chat_room_id',
            as: 'chatRoom'
        });
        Message.belongsTo(models.User, {
            foreignKey: 'sender_id',
            as: 'sender'
        });
        Message.belongsTo(models.Message, {
            foreignKey: 'original_message_id',
            as: 'originalMessage'
        });
        Message.belongsTo(models.Message, {
            foreignKey: 'reply_to',
            as: 'replyMessage'
        });
    };

    return Message;
};