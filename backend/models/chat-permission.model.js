'use strict';
module.exports = (sequelize, DataTypes) => {
    const ChatPermission = sequelize.define('ChatPermission', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        senderRole: {
            field: 'sender_role',
            type: DataTypes.STRING,
            allowNull: false
        },
        recipientRole: {
            field: 'recipient_role',
            type: DataTypes.STRING,
            allowNull: false
        },
        isAllowed: {
            field: 'is_allowed',
            type: DataTypes.BOOLEAN,
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
        tableName: 'ChatPermissions',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    ChatPermission.associate = function(models) {
        // associations can be defined here
    };

    return ChatPermission;
};