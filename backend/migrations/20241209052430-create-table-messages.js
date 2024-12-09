'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Messages', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            chat_room_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'ChatRooms',
                    key: 'id'
                }
            },
            sender_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            message: {
                type: Sequelize.TEXT
            },
            media_url: {
                type: Sequelize.STRING
            },
            message_type: {
                type: Sequelize.ENUM('text', 'image', 'document', 'link', 'module')
            },
            status: {
                type: Sequelize.ENUM('sent', 'delivered', 'read', 'unsent')
            },
            original_message_id: {
                type: Sequelize.UUID
            },
            reply_to: {
                type: Sequelize.UUID
            },
            is_forwarded: {
                type: Sequelize.BOOLEAN
            },
            is_updated: {
                type: Sequelize.BOOLEAN
            },
            is_information: {
                type: Sequelize.BOOLEAN
            },
            read_at: {
                type: Sequelize.DATE
            },
            unsent_at: {
                type: Sequelize.DATE
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
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Messages');
    }
};