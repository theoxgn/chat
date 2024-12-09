'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            },
            company_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            profile_picture: {
                type: Sequelize.STRING
            },
            role: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.STRING
            },
            name_changes_count: {
                type: Sequelize.INTEGER
            },
            last_name_change: {
                type: Sequelize.DATE
            },
            is_verified: {
                type: Sequelize.BOOLEAN
            },
            referral_code: {
                type: Sequelize.STRING
            },
            last_seen: {
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
        await queryInterface.dropTable('Users');
    }
};