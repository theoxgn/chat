'use strict';
module.exports = (sequelize, DataTypes) => {
    const PinnedChat = sequelize.define('PinnedChat', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            field: 'user_id',
            type: DataTypes.UUID,
            allowNull: false
        },
        chatRoomId: {
            field: 'chat_room_id',
            type: DataTypes.UUID,
            allowNull: false
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
        tableName: 'PinnedChat',
        underscored: true,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    PinnedChat.associate = function (models) {
        PinnedChat.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
        PinnedChat.belongsTo(models.ChatRoom, {
            foreignKey: 'chat_room_id',
            as: 'chatRoom'
        });
    };

    return PinnedChat;
};