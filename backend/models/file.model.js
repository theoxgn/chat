'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class File extends Model {
        static associate(models) {
            File.belongsTo(models.Message, {
                foreignKey: 'message_id',
                onDelete: 'CASCADE'
            });
        }
    }

    File.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        messageId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        originalName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        thumbnailFileUrl: {
            type: DataTypes.STRING
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        extension: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
    }, {
        sequelize,
        modelName: 'File',
        tableName: 'Files',
        underscored: true,
        timestamps: true,
    });
    return File;
};