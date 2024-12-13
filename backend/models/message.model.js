'use strict';
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        chatRoomId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        content: DataTypes.TEXT,
        mediaUrl: {
            type: DataTypes.STRING,
        },
        messageType: {
            type: DataTypes.ENUM(['text', 'image', 'document', 'link', 'module'])
        },
        status: {
            type: DataTypes.ENUM(['delivered', 'read'])
        },
        originalMessageId: {
            type: DataTypes.UUID,
        },
        replyTo: {
            type: DataTypes.UUID,
        },
        isForwarded: {
            type: DataTypes.BOOLEAN,
        },
        isUpdated: {
            type: DataTypes.BOOLEAN,
        },
        isInformation: {
            type: DataTypes.BOOLEAN,
        },
        readAt: {
            type: DataTypes.DATE,
        },
        originalInitiatorName: {
            type: DataTypes.STRING,
        },
        originalRecipientName: {
            type: DataTypes.STRING,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        deletedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'Messages',
        underscored: true,
        timestamps: true,
        paranoid: true,
    });

    Message.associate = function (models) {
        // associations can be defined here
        Message.belongsTo(models.ChatRoom, {
            foreignKey: 'chatRoomId',
            as: 'chatRoom'
        });
        Message.belongsTo(models.User, {
            foreignKey: 'senderId',
            as: 'sender'
        });
        Message.belongsTo(models.Message, {
            foreignKey: 'originalMessageId',
            as: 'originalMessage'
        });
        Message.belongsTo(models.Message, {
            foreignKey: 'replyTo',
            as: 'replyMessage'
        });
    };

    return Message;
};