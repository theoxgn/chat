'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('ChatRooms', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            menu_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'ChatMenus',
                    key: 'id'
                }
            },
            sub_menu_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'ChatSubMenus',
                    key: 'id'
                }
            },
            initiator: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            recipient: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            product_id: {
                type: Sequelize.UUID
            },
            last_activity: {
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
        await queryInterface.dropTable('ChatRooms');
    }
};