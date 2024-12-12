const {User} = require('../../models');
const sequelize = require("sequelize");
const db = require("../../models");
const ErrorResponse = require("../response/error.response");
const ChatRole = require("../enums/chat.role");

class MenuService {
    async getAllMenusByUser(userId, viewAs) {
        let oppositeRole = null;


        // * Find user by userId
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ErrorResponse(404, 'User not found');
        }

        // * Determine oposite role
        switch (viewAs) {
            // ? If view as buyer, show the sellers
            case ChatRole.BUYER:
                oppositeRole = ChatRole.SELLER;
                break;
            // ? If view as seller, show the buyers
            case ChatRole.SELLER:
                oppositeRole = ChatRole.BUYER;
                break;
            // ? If view as shipper, show the transporters
            case ChatRole.SHIPPER:
                oppositeRole = ChatRole.TRANSPORTER;
                break;
            // ? If view as transporter, show the shippers
            case ChatRole.TRANSPORTER:
                oppositeRole = ChatRole.SHIPPER;
                break;

        }

        const query = `
            SELECT cm.id               as menu_id,
                   cm.name             as menu_name,
                   JSON_AGG(sub_menus) as sub_menus
            FROM "ChatMenus" cm
                     INNER JOIN (SELECT csm.menu_id,
                                        JSON_BUILD_OBJECT(
                                                'sub_menu_id', csm.id,
                                                'sub_menu_name', csm.name,
                                                'unread_message_count', COALESCE(COUNT(
                                                                                         CASE
                                                                                             WHEN m.id IS NOT NULL
                                                                                                 AND
                                                                                                  m.sender_id != :userId
                                                                                                 AND
                                                                                                  (m.status = 'delivered' OR m.status = 'sent')
                                                                                                 THEN 1
                                                                                             END
                                                                                 ), 0)
                                        ) as sub_menus
                                 FROM "ChatSubMenus" csm
                                          INNER JOIN "ChatRooms" cr ON cr.sub_menu_id = csm.id
                                     and (
                                                                           (
                                                                               cr.initiator = :userId and
                                                                               cr.initiator_role = :viewAs and
                                                                               cr.recipient_role = :oppositeRole
                                                                               ) or (
                                                                               cr.recipient = :userId and
                                                                               cr.recipient_role = :viewAs and
                                                                               cr.initiator_role = :oppositeRole
                                                                               )
                                                                           )
                                          LEFT JOIN "Messages" m ON m.chat_room_id = cr.id
                                          LEFT JOIN "FavoriteSubMenus" fsm ON fsm.sub_menu_id = csm.id
                                 GROUP BY csm.menu_id, csm.id, csm.name) subquery ON subquery.menu_id = cm.id
            GROUP BY cm.id, cm.name
            ORDER BY cm.id        `;

        // * Find all menus by user
        return await db.sequelize.query(query, {
            replacements: {
                userId: userId,
                viewAs: viewAs,
                oppositeRole: oppositeRole,
            },
            type: sequelize.QueryTypes.SELECT,
            raw: true
        });
    }
}

module.exports = new MenuService();