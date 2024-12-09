'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('ChatRoomParticipants', {
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
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            is_pinned: {
                type: Sequelize.BOOLEAN
            },
            is_favorite: {
                type: Sequelize.BOOLEAN
            },
            pinned_at: {
                type: Sequelize.DATE
            },
            favorited_at: {
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
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('ChatRoomParticipants');
    }
};