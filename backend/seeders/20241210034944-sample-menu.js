'use strict';
const {v4: uuidv4} = require('uuid');

const now = new Date();

// Menu IDs
const BIG_FLEETS_SHIPPER_ID = uuidv4();
const BIG_FLEETS_TRANSPORTER_ID = uuidv4();
const TRANSPORT_MARKET_SHIPPER_ID = uuidv4();
const TRANSPORT_MARKET_TRANSPORTER_ID = uuidv4();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insert ChatMenus
        await queryInterface.bulkInsert('ChatMenus', [
            {
                id: BIG_FLEETS_SHIPPER_ID,
                name: 'Big Fleets Shipper',
                icon: 'shipper-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: BIG_FLEETS_TRANSPORTER_ID,
                name: 'Big Fleets Transporter',
                icon: 'transporter-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: TRANSPORT_MARKET_SHIPPER_ID,
                name: 'Transport Market Shipper',
                icon: 'shipper-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: TRANSPORT_MARKET_TRANSPORTER_ID,
                name: 'Transport Market Transporter',
                icon: 'transporter-icon',
                created_at: now,
                updated_at: now
            }
        ]);

        // Insert ChatSubMenus
        await queryInterface.bulkInsert('ChatSubMenus', [
            // Big Fleets Shipper SubMenus
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_SHIPPER_ID,
                name: 'Transporter',
                icon: 'transporter-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_SHIPPER_ID,
                name: 'Manajemen Mitra dan Grup',
                icon: 'management-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_SHIPPER_ID,
                name: 'Kontrak Harga',
                icon: 'contract-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_SHIPPER_ID,
                name: 'Tender',
                icon: 'tender-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_SHIPPER_ID,
                name: 'Instant Order',
                icon: 'order-icon',
                created_at: now,
                updated_at: now
            },

            // Big Fleets Transporter SubMenus
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_TRANSPORTER_ID,
                name: 'Shipper',
                icon: 'shipper-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_TRANSPORTER_ID,
                name: 'Manajemen Mitra dan Grup',
                icon: 'management-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_TRANSPORTER_ID,
                name: 'Kontrak Harga',
                icon: 'contract-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_TRANSPORTER_ID,
                name: 'Tender',
                icon: 'tender-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: BIG_FLEETS_TRANSPORTER_ID,
                name: 'Instant Order',
                icon: 'order-icon',
                created_at: now,
                updated_at: now
            },

            // Transport Market Shipper SubMenus
            {
                id: uuidv4(),
                menu_id: TRANSPORT_MARKET_SHIPPER_ID,
                name: 'Cari Promo',
                icon: 'cari-promo-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: TRANSPORT_MARKET_SHIPPER_ID,
                name: 'Cari Harga Transport',
                icon: 'cari-harga-transport-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: TRANSPORT_MARKET_SHIPPER_ID,
                name: 'Lelang Muatan',
                icon: 'lelang-muatan-icon',
                created_at: now,
                updated_at: now
            },

            // Transport Market Transporter SubMenus
            {
                id: uuidv4(),
                menu_id: TRANSPORT_MARKET_SHIPPER_ID,
                name: 'Promo',
                icon: 'promo-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: TRANSPORT_MARKET_SHIPPER_ID,
                name: 'Pricelist Transport',
                icon: 'pricelist-transport-icon',
                created_at: now,
                updated_at: now
            },
            {
                id: uuidv4(),
                menu_id: TRANSPORT_MARKET_SHIPPER_ID,
                name: 'Cari Lelang',
                icon: 'cari-lelang-icon',
                created_at: now,
                updated_at: now
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        // Remove all seeded data
        await queryInterface.bulkDelete('ChatSubMenus', null, {});
        await queryInterface.bulkDelete('ChatMenus', null, {});
    }
};