const {User, FavoriteSubMenu, ChatSubMenu} = require('../../models');
const sequelize = require("sequelize");
const db = require("../../models");
const ErrorResponse = require("../response/error.response");
const ChatRole = require("../enums/chat.role");

class MenuService {
    async getOppositeRole(viewAs) {
        switch (viewAs) {
            // ? If view as buyer, show the sellers
            case ChatRole.BUYER:
                return ChatRole.SELLER;
            // ? If view as seller, show the buyers
            case ChatRole.SELLER:
                return ChatRole.BUYER;
            // ? If view as shipper, show the transporters
            case ChatRole.SHIPPER:
                return ChatRole.TRANSPORTER;
            // ? If view as transporter, show the shippers
            case ChatRole.TRANSPORTER:
                return ChatRole.SHIPPER;
            default:
                return null;
        }
    }

    async getAllMenusByUser(userId, viewAs) {
        let oppositeRole = null;

        // * Find user by userId
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ErrorResponse(404, 'User not found');
        }

        // * Determine oposite role
        oppositeRole = await this.getOppositeRole(viewAs);

        const query = `
            SELECT cm.id               as "menuId",
                   cm.name             as "menuName",
                   JSON_AGG(sub_menus) as "subMenus"
            FROM "ChatMenus" cm
                     INNER JOIN (SELECT csm.menu_id,
                                        JSON_BUILD_OBJECT(
                                                'subMenuId', csm.id,
                                                'subMenuName', csm.name,
                                                'unreadMessageCount', COALESCE(COUNT(
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

    async favoriteSubMenu(subMenuId, userId, viewAs) {
        // * Validate user
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ErrorResponse(404, 'User not found');
        }

        // * Validate sub menu
        const subMenu = await ChatSubMenu.findByPk(subMenuId);
        if (!subMenu) {
            throw new ErrorResponse(404, 'Sub menu not found');
        }


        // * Find favorite sub menu
        const favoriteSubMenu = await FavoriteSubMenu.findOne({
            where: {
                userId: userId,
                subMenuId: subMenuId,
                viewAs: viewAs
            }
        });

        // * If favorite sub menu exists, delete it
        if (favoriteSubMenu) {
            const result = await favoriteSubMenu.destroy();
            if (result) {
                return `Unmark sub menu ${subMenuId} as favorite successfully`;
            }
        } else {
            // * If favorite sub menu does not exist, create it
            const result = await FavoriteSubMenu.create({
                userId: userId,
                subMenuId: subMenuId,
                viewAs: viewAs
            });
            if (result) {
                return `Mark sub menu ${subMenuId} as favorite successfully`;
            }
        }
    }

    async getAllMenusFavoriteByUser(userId, viewAs) {
        let oppositeRole = null;

        // * Find user by userId
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ErrorResponse(404, 'User not found');
        }

        // * Determine oposite role
        oppositeRole = await this.getOppositeRole(viewAs);

        const query = `
            select distinct csm.menu_id    as "menuId",
                            csm.id         as "subMenuId",
                            name,
                            icon,
                            FSM.created_at as "favoriteAt"
            from "ChatSubMenus" csm
                     left join public."FavoriteSubMenus" FSM on csm.id = FSM.sub_menu_id
                     left join public."ChatRooms" CR on csm.id = CR.sub_menu_id
            where FSM.user_id = :userId
              and ((
                       cr.initiator = :userId and
                       cr.initiator_role = :viewAs and
                       cr.recipient_role = :oppositeRole
                       ) or
                   (
                       cr.recipient = :userId and
                       cr.recipient_role = :viewAs and
                       cr.initiator_role = :oppositeRole
                       ))
              and FSM.view_as = :viewAs
            order by FSM.created_at desc;`

        // * Find all menus favorite by user
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