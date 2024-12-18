const typingUsers = require("../store/typingUsers.store")
const {PinnedChat, User, ChatRoom, Message} = require("../../models");
const ChatRole = require("../enums/chat.role");
const db = require("../../models");
const {QueryTypes, Op} = require("sequelize");
const MenuService = require("./menu.service");

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

    async getAllChatsViewCategory(userId, viewAs, subMenuId, isAll, page = 1, size = 10) {
        // * Define pagination
        let filter = ' and 1=1';
        const offset = (page - 1) * size;
        const limit = size;
        let oppositeRole = null;

        // * Determine oposite role
        oppositeRole = await MenuService.getOppositeRole(viewAs);

        console.log(isAll)
        console.log(typeof (isAll));

        if (isAll === 'false' || isAll === false) {
            filter = 'and COALESCE(UC.unread_count, 0) > 0'
        }

        // * Find chat (represent chatroom) by userId
        // * Viewer is role of user in chatroom
        // * Opposite is role of other user in chatroom
        const chats = await db.sequelize.query(
            `
                WITH UnreadCounts AS (SELECT chat_room_id,
                                             COUNT(*) as unread_count
                                      FROM public."Messages" unread
                                      WHERE unread.status = 'delivered'
                                        AND unread.sender_id != :userId
                                      GROUP BY chat_room_id)
                select cr.id                        as "id",
                       CASE
                           WHEN M.deleted_at IS NOT NULL THEN 'This message was deleted'
                           WHEN M.content IS NULL OR M.content = '' THEN COALESCE(F.original_name, '')
                           ELSE M.content
                           END                      as "lastMessageContent",
                       M.created_at                 as "lastMessageCreatedAt",
                       M.message_type               as "lastMessageType",
                       M.status                     as "lastMessageStatus",
                       M.sender_id                  as "lastMessageSenderId",
                       PC.created_at                as "pinnedAt",
                       CM.name                      as "menuName",
                       CSM.name                     as "subMenuName",
                       COALESCE(UC.unread_count, 0) as "unreadCount",
                       CASE
                           WHEN initiator.id = :userId AND :viewAs = 'buyer' THEN recipient.company_name
                           WHEN initiator.id = :userId AND :viewAs != 'buyer' THEN recipient.username
                           ELSE initiator.username
                           END                      as "opponentName",
                       CASE
                           WHEN initiator.id = :userId THEN recipient.id
                           ELSE initiator.id
                           END                      as "opponentId"
                from "ChatRooms" cr
                         left join public."Users" initiator on cr.initiator = initiator.id
                         left join public."Users" recipient on cr.recipient = recipient.id
                         left join (select distinct on (chat_room_id) *
                                    from public."Messages"
                                    order by chat_room_id, created_at desc) M on cr.id = M.chat_room_id
                         left join public."Files" F on M.id = F.message_id
                         left join public."PinnedChat" PC on cr.id = PC.chat_room_id
                         left join public."ChatSubMenus" CSM on cr.sub_menu_id = CSM.id
                         left join public."ChatMenus" CM on CSM.menu_id = CM.id
                         left join UnreadCounts UC on cr.id = UC.chat_room_id
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

    async getAllChatsViewUser(userId, viewAs, subMenuId, isAll, page = 1, size = 10) {
        // * Define pagination
        let filter = ' and 1=1';
        const offset = (page - 1) * size;
        const limit = size;
        let oppositeRole = null;

        // * Determine oposite role
        oppositeRole = await MenuService.getOppositeRole(viewAs);

        console.log(isAll)
        console.log(typeof (isAll));

        if (isAll === 'false' || isAll === false) {
            filter = 'and unread_count > 0';
        }

        // * Find chat (represent chatroom) by userId
        // * Viewer is role of user in chatroom
        // * Opposite is role of other user in chatroom
        const chats = await db.sequelize.query(
            `
                WITH UnreadCounts AS (SELECT chat_room_id,
                                             COUNT(*) as unread_count
                                      FROM public."Messages" unread
                                      WHERE unread.status = 'delivered'
                                        AND unread.sender_id != :userId
                                      GROUP BY chat_room_id)
                select cr.id         as id,
                       PC.created_at as "pinnedAt",
                       json_build_object(
                               'lastMessageContent',
                               CASE
                                   WHEN M.deleted_at IS NOT NULL THEN 'This message was deleted'
                                   WHEN M.content IS NULL OR M.content = '' THEN COALESCE(F.original_name, '')
                                   ELSE M.content
                                   END,
                               'lastMessageCreatedAt', M.created_at,
                               'lastMessageType', M.message_type,
                               'lastMessageStatus', M.status,
                               'lastMessageSenderId', M.sender_id,
                               'menuName', CM.name,
                               'subMenuName', CSM.name,
                               'unreadCount', COALESCE(UC.unread_count, 0)
                       )             as chats,
                       CASE
                           WHEN initiator.id = :userId AND :viewAs = 'buyer' THEN recipient.company_name
                           WHEN initiator.id = :userId AND :viewAs != 'buyer' THEN recipient.username
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
                         left join public."Files" F on M.id = F.message_id
                         left join public."PinnedChat" PC on cr.id = PC.chat_room_id
                         left join public."ChatSubMenus" CSM on cr.sub_menu_id = CSM.id
                         left join public."ChatMenus" CM on CSM.menu_id = CM.id
                         left join UnreadCounts UC on cr.id = UC.chat_room_id
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
                    M.deleted_at,
                    M.sender_id,
                    CM.name,
                    CSM.name,
                    UC.unread_count,
                    F.original_name
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

    async searchChatsByMessage(searchTerm, viewAs, subMenuId, currentUserId) {
        // * Get opposite role
        const opponentRole = await MenuService.getOppositeRole(viewAs);

        // * Filter
        const filter = {}
        if (searchTerm) {
            filter.content = {
                [Op.iLike]: `%${searchTerm}%`
            }
        }

        const chatRooms = await ChatRoom.findAll({
            where: {
                subMenuId: subMenuId,
                [Op.or]: [
                    {
                        // Current user is recipient
                        initiatorRole: opponentRole,
                        recipientRole: viewAs,
                        recipient: currentUserId
                    },
                    {
                        // Current user is initiator
                        initiatorRole: viewAs,
                        recipientRole: opponentRole,
                        initiator: currentUserId
                    }
                ]
            },
            include: [
                {
                    model: Message,
                    as: 'messages',
                    where: filter,
                    required: true,
                    attributes: ['content', 'createdAt', 'status']
                },
                {
                    model: User,
                    as: 'initiatorUser',
                    attributes: ['id', 'companyName', 'username']
                },
                {
                    model: User,
                    as: 'recipientUser',
                    attributes: ['id', 'companyName', 'username']
                }
            ],
            attributes: ['id'],
            order: [[{model: Message, as: 'messages'}, 'createdAt', 'DESC']]
        });

        // Format the response
        return Promise.all(chatRooms.map(async chat => {
            // Get last message
            const lastMessage = await Message.findOne({
                where: {chatRoomId: chat.id},
                order: [['createdAt', 'DESC']],
                attributes: ['content', 'createdAt', 'status'],
                raw: true
            });

            // Count unread messages (status is 'delivered')
            const unreadCount = await Message.count({
                where: {
                    chatRoomId: chat.id,
                    status: {
                        [Op.in]: ['delivered']
                    },
                    senderId: {
                        [Op.ne]: currentUserId  // Only count messages not sent by current user
                    }
                }
            });

            // Determine which name to display based on role
            const opponentUser = chat.initiatorRole === opponentRole ? chat.initiatorUser : chat.recipientUser;
            const displayName = opponentRole === ChatRole.BUYER ?
                opponentUser.username :
                opponentUser.companyName;

            return {
                id: chat.id,
                name: displayName,
                lastMessageContent: lastMessage?.content || '',
                lastMessageCreatedAt: lastMessage?.createdAt || null,
                lastMessageStatus: lastMessage?.status || null,
                unreadMessages: unreadCount
            };
        }));
    }
}

module.exports = new ChatService();