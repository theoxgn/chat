'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatSubMenu = sequelize.define('ChatSubMenu', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        menuId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        icon: DataTypes.STRING,
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ChatSubMenus',
        underscored: true,
        timestamps: true,
    });

    ChatSubMenu.associate = function (models) {
        ChatSubMenu.belongsTo(models.ChatMenu, {
            foreignKey: 'menuId',
            as: 'menu'
        });
        ChatSubMenu.hasMany(models.ChatRoom, {
            foreignKey: 'subMenuId',
            as: 'chatRooms'
        });
        ChatSubMenu.hasMany(models.FavoriteSubMenu, {
            foreignKey: 'subMenuId',
            as: 'favoriteSubMenus'
        });
    };

    return ChatSubMenu;
};