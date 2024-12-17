'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Files', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            message_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Messages',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            original_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            thumbnail_file_url: {
                type: Sequelize.STRING
            },
            file_url: {
                type: Sequelize.STRING,
                allowNull: false
            },
            file_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            extension: {
                type: Sequelize.STRING,
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Files');
    }
};