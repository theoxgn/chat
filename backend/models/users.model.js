'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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
            field: 'company_name',
            type: DataTypes.STRING,
            allowNull: true
        },
        profilePicture: {
            field: 'profile_picture',
            type: DataTypes.STRING
        },
        role: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING
        },
        nameChangesCount: {
            field: 'name_changes_count',
            type: DataTypes.INTEGER
        },
        lastNameChange: {
            field: 'last_name_change',
            type: DataTypes.DATE
        },
        isVerified: {
            field: 'is_verified',
            type: DataTypes.BOOLEAN
        },
        referralCode: {
            field: 'referral_code',
            type: DataTypes.STRING
        },
        lastSeen: {
            field: 'last_seen',
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
        },
        deletedAt: {
            field: 'deleted_at',
            type: DataTypes.DATE
        }
    }, {
        tableName: 'Users',
        underscored: true,
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
    });

    // models/user.model.js
    User.associate = function (models) {
        User.hasMany(models.PinnedChat, {
            foreignKey: 'user_id',
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