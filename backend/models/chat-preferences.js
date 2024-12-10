'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatPreferences = sequelize.define('ChatPreferences', {
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
        isPinned: {
            field: 'is_pinned',
            type: DataTypes.BOOLEAN
        },
        isFavorite: {
            field: 'is_favorite',
            type: DataTypes.BOOLEAN
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
        tableName: 'ChatPreferences',
        underscored: true,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    ChatPreferences.associate = function (models) {
        ChatPreferences.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return ChatPreferences;
};