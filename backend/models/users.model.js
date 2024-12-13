'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        muatUserId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        profilePicture: {
            type: DataTypes.STRING
        },
        role: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING
        },
        nameChangesCount: {
            type: DataTypes.INTEGER
        },
        lastNameChange: {
            type: DataTypes.DATE
        },
        isVerified: {
            type: DataTypes.BOOLEAN
        },
        referralCode: {
            type: DataTypes.STRING
        },
        lastSeen: {
            type: DataTypes.DATE
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        deletedAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'Users',
        underscored: true,
        timestamps: true,
        paranoid: true,
    });

    // models/user.model.js
    User.associate = function (models) {
        User.hasMany(models.PinnedChat, {
            foreignKey: 'userId',
            as: 'pinnedChats'
        });

        User.hasMany(models.ChatRoom, {
            foreignKey: 'initiator',
            as: 'initiatedChats'
        });

        User.hasMany(models.ChatRoom, {
            foreignKey: 'recipient',
            as: 'receivedChats'
        });
    };

    return User;
};