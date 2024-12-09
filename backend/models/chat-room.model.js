'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatRoom = sequelize.define('ChatRoom', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        menuId: {
            field: 'menu_id',
            type: DataTypes.UUID,
            allowNull: false
        },
        subMenuId: {
            field: 'sub_menu_id',
            type: DataTypes.UUID,
            allowNull: false
        },
        initiator: {
            type: DataTypes.UUID,
            allowNull: false
        },
        recipient: {
            type: DataTypes.UUID,
            allowNull: false
        },
        lastActivity: {
            field: 'last_activity',
            type: DataTypes.DATE,
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
        tableName: 'ChatRooms',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    ChatRoom.associate = function (models) {
        // associations can be defined here
        ChatRoom.belongsTo(models.ChatMenu, {
            foreignKey: 'menu_id',
            as: 'menu'
        });
        ChatRoom.belongsTo(models.ChatSubMenu, {
            foreignKey: 'sub_menu_id',
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
    };

    return ChatRoom;
};