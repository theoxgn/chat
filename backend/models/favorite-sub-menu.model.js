'use strict';
module.exports = (sequelize, DataTypes) => {
    const FavoriteSubMenu = sequelize.define('FavoriteSubMenu', {
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
        subMenuId: {
            field: 'sub_menu_id',
            type: DataTypes.UUID,
            allowNull: false
        },
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'FavoriteSubMenus',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    FavoriteSubMenu.associate = function(models) {
        // associations can be defined here
        FavoriteSubMenu.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
        FavoriteSubMenu.belongsTo(models.ChatSubMenu, {
            foreignKey: 'sub_menu_id',
            as: 'subMenu'
        });
    };

    return FavoriteSubMenu;
};