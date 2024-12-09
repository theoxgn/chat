'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('ChatSubMenus', {
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
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            icon: {
                type: Sequelize.STRING
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
        await queryInterface.dropTable('ChatSubMenus');
    }
};