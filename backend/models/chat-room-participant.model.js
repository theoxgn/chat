'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatRoomParticipant = sequelize.define('ChatRoomParticipant', {
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
        userId: {
            field: 'user_id',
            type: DataTypes.UUID,
            allowNull: false
        },
        isPinned: {
            field: 'is_pinned',
            type:DataTypes.BOOLEAN
        },
        isFavorite: {
            field: 'is_favorite',
            type:DataTypes.BOOLEAN
        },
        pinnedAt: {
            field: 'pinned_at',
            type: DataTypes.DATE
        },
        favoritedAt: {
            field: 'favorited_at',
            type: DataTypes.DATE
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
        }
    }, {
        tableName: 'ChatRoomParticipants',
        underscored: true,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    ChatRoomParticipant.associate = function(models) {
        ChatRoomParticipant.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
        ChatRoomParticipant.belongsTo(models.ChatRoom, {
            foreignKey: 'chat_room_id',
            as: 'chatRoom'
        });
    };

    return ChatRoomParticipant;
};