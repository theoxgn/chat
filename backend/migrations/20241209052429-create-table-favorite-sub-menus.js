'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('FavoriteSubMenus', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            sub_menu_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'ChatSubMenus',
                    key: 'id'
                }
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('FavoriteSubMenus');
    }
};