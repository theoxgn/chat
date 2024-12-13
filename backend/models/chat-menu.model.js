'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatMenu = sequelize.define('ChatMenu', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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
        tableName: 'ChatMenus',
        underscored: true,
        timestamps: true,
    });

    ChatMenu.associate = function (models) {
        ChatMenu.hasMany(models.ChatSubMenu, {
            foreignKey: 'menuId',
            as: 'subMenus'
        });
    };

    return ChatMenu;
};