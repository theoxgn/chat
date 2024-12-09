'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatSubMenu = sequelize.define('ChatSubMenu', {
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
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        icon: DataTypes.STRING,
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
        tableName: 'ChatSubMenus',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    ChatSubMenu.associate = function(models) {
        ChatSubMenu.belongsTo(models.ChatMenu, {
            foreignKey: 'menu_id',
            as: 'menu'
        });
        ChatSubMenu.hasMany(models.ChatRoom, {
            foreignKey: 'sub_menu_id',
            as: 'chatRooms'
        });
        ChatSubMenu.hasMany(models.FavoriteSubMenu, {
            foreignKey: 'sub_menu_id',
            as: 'favoriteSubMenus'
        });
    };

    return ChatSubMenu;
};