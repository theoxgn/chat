'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Users', [
            {
                id: "550e8400-e29b-41d4-a716-446655442222",
                muat_user_id: "1",
                username: 'buyer',
                company_name: 'Buyer Sentosa',
                email: 'buyeruser@example.com',
                password: 'password123',
                profile_picture: 'https://example.com/buyer.png',
                role: 'buyer',
                status: 'active',
                name_changes_count: 0,
                last_name_change: new Date(),
                is_verified: false,
                referral_code: 'BUYER123',
                last_seen: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655441111",
                muat_user_id: "2",
                username: 'seller',
                company_name: 'Seller Abadi',
                email: 'selleruser@example.com',
                password: 'password123',
                profile_picture: 'https://example.com/seller.png',
                role: 'seller',
                status: 'active',
                name_changes_count: 0,
                last_name_change: new Date(),
                is_verified: false,
                referral_code: 'SELLER123',
                last_seen: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655443333",
                muat_user_id: "3",
                username: 'transporter',
                company_name: 'Transporter Express',
                email: 'transporteruser@example.com',
                password: 'password123',
                profile_picture: 'https://example.com/transporter.png',
                role: 'transporter',
                status: 'active',
                name_changes_count: 0,
                last_name_change: new Date(),
                is_verified: false,
                referral_code: 'TRANSPORTER123',
                last_seen: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655444444",
                muat_user_id: "4",
                username: 'shipper',
                company_name: 'Shipper Logistics',
                email: 'shipperuser@example.com',
                password: 'password123',
                profile_picture: 'https://example.com/shipper.png',
                role: 'shipper',
                status: 'active',
                name_changes_count: 0,
                last_name_change: new Date(),
                is_verified: false,
                referral_code: 'SHIPPER123',
                last_seen: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Users', {
            email: {
                [Sequelize.Op.in]: ['buyeruser@example.com', 'selleruser@example.com', 'shipperuser@example.com', 'transporteruser@example.com']
            }
        }, {});
    }
};