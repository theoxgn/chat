const {User} = require('../../models');
const sequelize = require("sequelize");
const db = require("../../models");

class MenuService {
    async getAllMenusByUser(userId) {
        // * Find user by userId
        const user = await User.findByPk(userId);
        if (!user) {
            return {success: false, message: 'User not found'};
        }

        const query = `
            SELECT cm.id        as menu_id,
                   cm.name      as menu_name,
                   csm.id       as sub_menu_id,
                   csm.name     as sub_menu_name,
                   COALESCE(COUNT(CASE
                                      WHEN m.id IS NOT NULL
                                          AND m.sender_id != :userId
                                          AND (m.status = 'delivered' OR m.status = 'sent')
                                          THEN 1
                       END), 0) AS unread_message_count
            FROM "ChatMenus" cm
                     INNER JOIN "ChatSubMenus" csm ON csm.menu_id = cm.id
                     INNER JOIN "ChatRooms" cr ON cr.sub_menu_id = csm.id
                     LEFT JOIN "Messages" m ON m.chat_room_id = cr.id
            GROUP BY cm.id, cm.name, csm.id, csm.name
            ORDER BY cm.id, csm.id
        `;

        // * Find all menus by user
        return await db.sequelize.query(query, {
            replacements: {
                userId: userId
            },
            type: sequelize.QueryTypes.SELECT,
            raw: true
        });
    }
}

module.exports = new MenuService();