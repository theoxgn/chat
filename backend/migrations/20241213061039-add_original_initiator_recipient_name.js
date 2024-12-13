'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Messages', 'original_initiator_name', {
            type: Sequelize.STRING
        });
        await queryInterface.addColumn('Messages', 'original_recipient_name', {
            type: Sequelize.STRING
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Messages', 'original_initiator_name');
        await queryInterface.removeColumn('Messages', 'original_recipient_name');
    }
};