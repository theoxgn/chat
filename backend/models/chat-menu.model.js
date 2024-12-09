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
            field: 'created_at',
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            field: 'updatedAt',
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ChatMenus',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    ChatMenu.associate = function(models) {
        ChatMenu.hasMany(models.ChatSubMenu, {
            foreignKey: 'menu_id',
            as: 'subMenus'
        });
    };

    return ChatMenu;
};