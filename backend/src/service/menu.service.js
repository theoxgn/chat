const {ChatMenu, ChatSubMenu, User, ChatRoom, Message} = require('../../models');

class MenuService {
    async getAllMenusByUser(userId) {
        // * Find user by userId
        const user = await User.findByPk(userId);
        if (!user) {
            return {success: false, message: 'User not found'};
        }

        // * Find all menus by user
        return await ChatMenu.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    attributes: ['id', 'name'],
                    model: ChatSubMenu,
                    as: 'subMenus',
                    required: true,
                    include: [
                        {
                            model: ChatRoom,
                            as: 'chatRooms',
                            required: true,
                            attributes: [],
                            include: [
                                {
                                    model: Message,
                                    as: 'messages',
                                    required: true,
                                    attributes: [],
                                    where: {
                                        senderId: userId
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }
}

module.exports = new MenuService();