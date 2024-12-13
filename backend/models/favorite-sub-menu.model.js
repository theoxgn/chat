'use strict';
module.exports = (sequelize, DataTypes) => {
    const FavoriteSubMenu = sequelize.define('FavoriteSubMenu', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        subMenuId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        viewAs: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'FavoriteSubMenus',
        underscored: true,
        timestamps: true,
        updatedAt: false
    });

    FavoriteSubMenu.associate = function (models) {
        // associations can be defined here
        FavoriteSubMenu.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        FavoriteSubMenu.belongsTo(models.ChatSubMenu, {
            foreignKey: 'subMenuId',
            as: 'subMenu'
        });
    };

    return FavoriteSubMenu;
};