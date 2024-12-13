'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatRoom = sequelize.define('ChatRoom', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        menuId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        subMenuId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        initiator: {
            type: DataTypes.UUID,
            allowNull: false
        },
        initiatorRole: {
            type: DataTypes.STRING,
            allowNull: false
        },
        recipient: {
            type: DataTypes.UUID,
            allowNull: false
        },
        recipientRole: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastActivity: {
            type: DataTypes.DATE,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ChatRooms',
        underscored: true,
        timestamps: true,
    });

    ChatRoom.associate = function (models) {
        // associations can be defined here
        ChatRoom.belongsTo(models.ChatMenu, {
            foreignKey: 'menuId',
            as: 'menu'
        });
        ChatRoom.belongsTo(models.ChatSubMenu, {
            foreignKey: 'subMenuId',
            as: 'subMenu'
        });
        ChatRoom.belongsTo(models.User, {
            foreignKey: 'initiator',
            as: 'initiatorUser'
        });
        ChatRoom.belongsTo(models.User, {
            foreignKey: 'recipient',
            as: 'recipientUser'
        });
        ChatRoom.hasMany(models.Message, {
            foreignKey: 'chatRoomId',
            as: 'messages'
        });
        // Di chat-room.model.js, tambahkan ini di dalam ChatRoom.associate
        ChatRoom.hasMany(models.PinnedChat, {
            foreignKey: 'chatRoomId',
            as: 'pinnedChats'
        });
    };

    return ChatRoom;
};