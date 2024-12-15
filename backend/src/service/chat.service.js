const typingUsers = require("../store/typingUsers.store")
const {PinnedChat, User, ChatRoom, Message} = require("../../models");
const ChatRole = require("../enums/chat.role");
const db = require("../../models");
const {QueryTypes} = require("sequelize");

class ChatService {
    // * Already implement socket.io (see in app.js)
    async createChatTypingStatus(roomId, userId, typing) {
        const roomKey = `room:${roomId}`;
        let roomTyping = typingUsers.get(roomKey) || new Set();

        if (typing) {
            roomTyping.add(userId);
        } else {
            roomTyping.delete(userId);
        }

        typingUsers.set(roomKey, roomTyping);

        // Auto-remove typing status after 3 seconds
        setTimeout(() => {
            const currentRoom = typingUsers.get(roomKey);
            if (currentRoom) {
                currentRoom.delete(userId);
                if (currentRoom.size === 0) {
                    typingUsers.delete(roomKey);
                } else {
                    typingUsers.set(roomKey, currentRoom);
                }
            }
        }, 3000);

        return {
            success: true,
            typingUsers: Array.from(roomTyping)
        };

    }

    // * Already implement socket.io (see in app.js)
    async getChatTypingStatus(roomKey) {
        const roomTyping = typingUsers.get(roomKey) || new Set();
        return {
            typingUsers: Array.from(roomTyping)
        };
    }

    async createChatPin(userId, roomId) {
        // * Validate userId exists
        const user = await User.findByPk(userId);
        if (!user) {
            return {success: false, message: 'User not found'};
        }

        // * Validate roomId exists
        const chatRoom = await ChatRoom.findByPk(roomId);
        if (!chatRoom) {
            return {success: false, message: 'Chat room not found'};
        }

        // * If not exists, create a new pinned chat
        // * If exists, return success
        const pinnedChat = await PinnedChat.findOne({where: {userId: userId, chatRoomId: roomId}});
        if (pinnedChat) {
            return {success: true, result: pinnedChat};
        }
        const result = await PinnedChat.create({
            userId: userId,
            chatRoomId: roomId,
        });
        if (result) {
            return {success: true, result: result};
        } else {
            return {success: false, result: result};
        }
    }

    async deleteChatPin(userId, roomId) {
        // * Validate userId exists
        const user = await User.findByPk(userId);
        if (!user) {
            return {success: false, message: 'User not found'};
        }

        // * Validate roomId exists
        const chatRoom = await ChatRoom.findByPk(roomId);
        if (!chatRoom) {
            return {success: false, message: 'Chat room not found'};
        }

        // * If exists, delete the pinned chat
        // * If not exists, return success
        const pinnedChat = await PinnedChat.findOne({where: {userId: userId, chatRoomId: roomId}});
        if (pinnedChat) {
            await pinnedChat.destroy();
            return {success: true};
        } else {
            return {success: true};
        }
    }

    async getPinnedChats(userId) {
        return await PinnedChat.findAll({
            where: {
                userId: userId
            },
            order: [['createdAt', 'DESC']]
        });
    }

    async getAllChatsViewCategory(userId, viewAs, subMenuId, isAll, page, size) {
        // * Define pagination
        let filter = ' and 1=1';
        const offset = page * size;
        const limit = size;
        let oppositeRole = null;

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
        console.log(isAll)
        console.log(typeof (isAll));

        if (isAll === 'false' || isAll === false) {
            filter = 'and M.status = \'delivered\''
        }

        // * Find chat (represent chatroom) by userId
        // * Viewer is role of user in chatroom
        // * Opposite is role of other user in chatroom
        const chats = await db.sequelize.query(
            `
                select cr.id                               as "id",
                       M.content                           as "lastMessageContent",
                       M.created_at                        as "lastMessageCreatedAt",
                       M.message_type                      as "lastMessageType",
                       M.status                            as "lastMessageStatus",
                       PC.created_at                       as "pinnedAt",
                       CM.name                             as "menuName",
                       CSM.name                            as "subMenuName",
                       (SELECT COUNT(*)
                        FROM public."Messages" unread
                        WHERE unread.chat_room_id = cr.id
                          AND (unread.status = 'delivered' or unread.status = 'sent')
                          AND unread.sender_id != :userId) as "unreadCount",
                       CASE
                           WHEN initiator.id = :userId THEN recipient.username
                           ELSE initiator.username
                           END                             as "opponentName",
                       CASE
                           WHEN initiator.id = :userId THEN recipient.id
                           ELSE initiator.id
                           END                             as "opponentId"
                from "ChatRooms" cr
                         left join public."Users" initiator on cr.initiator = initiator.id
                         left join public."Users" recipient on cr.recipient = recipient.id
                         left join (select distinct on (chat_room_id) *
                                    from public."Messages"
                                    order by chat_room_id, created_at desc) M on cr.id = M.chat_room_id
                         left join public."PinnedChat" PC on cr.id = PC.chat_room_id
                         left join public."ChatSubMenus" CSM on cr.sub_menu_id = CSM.id
                         left join public."ChatMenus" CM on CSM.menu_id = CM.id
                where ((
                           cr.initiator = :userId and
                           cr.initiator_role = :viewAs and
                           cr.recipient_role = :oppositeRole
                           ) or
                       (
                           cr.recipient = :userId and
                           cr.recipient_role = :viewAs and
                           cr.initiator_role = :oppositeRole
                           ))
                  and cr.sub_menu_id = :subMenuId
                  and M.created_at is not null
                    ${filter}

                order by PC.created_at desc nulls last,
                    M.created_at desc nulls last
                limit :limit offset :offset
            `,
            {
                replacements: {
                    userId: userId,
                    viewAs: viewAs,
                    oppositeRole: oppositeRole,
                    subMenuId: subMenuId,
                    limit: limit,
                    offset: offset
                },
                type: QueryTypes.SELECT
            })
        return chats
    }

    async getAllChatsViewUser(userId, viewAs, subMenuId, isAll, page, size) {
        // * Define pagination
        let filter = ' and 1=1';
        const offset = page * size;
        const limit = size;
        let oppositeRole = null;

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
        console.log(isAll)
        console.log(typeof (isAll));

        if (isAll === 'false' || isAll === false) {
            filter = 'and M.status = \'delivered\''
        }

        // * Find chat (represent chatroom) by userId
        // * Viewer is role of user in chatroom
        // * Opposite is role of other user in chatroom
        const chats = await db.sequelize.query(
            `
                select cr.id         as id,
                       PC.created_at as "pinnedAt",
                       json_build_object(
                               'lastMessageContent', M.content,
                               'lastMessageCreatedAt', M.created_at,
                               'lastMessageType', M.message_type,
                               'lastMessageStatus', M.status,
                               'menuName', CM.name,
                               'subMenuName', CSM.name,
                               'unreadCount', (SELECT COUNT(*)
                                               FROM public."Messages" unread
                                               WHERE unread.chat_room_id = cr.id
                                                 AND (unread.status = 'delivered' or unread.status = 'sent')
                                                 AND unread.sender_id != :userId)
                       )             as chats,
                       CASE
                           WHEN initiator.id = :userId THEN recipient.username
                           ELSE initiator.username
                           END       as "opponentName",
                       CASE
                           WHEN initiator.id = :userId THEN recipient.id
                           ELSE initiator.id
                           END       as "opponentId"
                from "ChatRooms" cr
                         left join public."Users" initiator on cr.initiator = initiator.id
                         left join public."Users" recipient on cr.recipient = recipient.id
                         left join (select distinct on (chat_room_id) *
                                    from public."Messages"
                                    order by chat_room_id, created_at desc) M on cr.id = M.chat_room_id
                         left join public."PinnedChat" PC on cr.id = PC.chat_room_id
                         left join public."ChatSubMenus" CSM on cr.sub_menu_id = CSM.id
                         left join public."ChatMenus" CM on CSM.menu_id = CM.id
                where ((
                           cr.initiator = :userId and
                           cr.initiator_role = :viewAs and
                           cr.recipient_role = :oppositeRole
                           ) or
                       (
                           cr.recipient = :userId and
                           cr.recipient_role = :viewAs and
                           cr.initiator_role = :oppositeRole
                           ))
                  and cr.sub_menu_id = :subMenuId
                  and M.created_at is not null
                    ${filter}
                group by
                    cr.id,
                    initiator.id,
                    initiator.username,
                    cr.initiator_role,
                    recipient.id,
                    recipient.username,
                    cr.recipient_role,
                    PC.created_at,
                    M.created_at,
                    M.content,
                    M.message_type,
                    M.status,
                    CM.name,
                    CSM.name
                order by PC.created_at desc nulls last,
                    M.created_at desc nulls last
                limit :limit offset :offset
            `,
            {
                replacements: {
                    userId: userId,
                    viewAs: viewAs,
                    oppositeRole: oppositeRole,
                    subMenuId: subMenuId,
                    limit: limit,
                    offset: offset
                },
                type: QueryTypes.SELECT
            })
        return chats
    }
}

module.exports = new ChatService();