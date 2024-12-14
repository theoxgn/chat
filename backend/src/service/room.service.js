// * Import model
const {ChatRoom, ChatMenu, ChatSubMenu} = require('../../models');
const {Op} = require("sequelize");
const MessageService = require('./message.service');

class RoomService {
    async createOrFindRoom(initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName, message) {
        // * check menu and sub menu are exists
        const subMenu = await ChatSubMenu.findOne({
            where: {
                name: subMenuName,
            },
            include: {
                model: ChatMenu,
                as: 'menu',
                where: {
                    name: menuName
                }
            }
        });
        if (!subMenu) {
            throw new Error('Sub menu not found');
        }

        // * check if a room already exists for these users
        console.log(initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName);
        const existingRoom = await ChatRoom.findOne({
            where: {
                [Op.and]: [
                    {menuId: subMenu.menuId},
                    {subMenuId: subMenu.id},
                    {initiator: initiatorId},
                    {recipient: recipientId},
                    {initiatorRole},
                    {recipientRole}
                ]
            }
        });
        if (existingRoom) {
            return {
                id: existingRoom.id,
                created_at: existingRoom.created_at
            }
        }

        // * If no room exists, create a new one
        const result = await ChatRoom.create({
            menuId: subMenu.menuId,
            subMenuId: subMenu.id,
            initiator: initiatorId,
            initiatorRole,
            recipient: recipientId,
            recipientRole
        });

        // * If has message, create message in the room
        if (message) {
            await MessageService.createMessage(result.id, initiatorId, message);
        }

        return {
            id: result.id,
            created_at: result.created_at
        }
    }
}

module.exports = new RoomService();