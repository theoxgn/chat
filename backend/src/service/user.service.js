const onlineUsers = require("../store/onlineUsers.store");
const {User, ChatRoom} = require('../../models');
const {Op} = require("sequelize");
const ResponseError = require("../response/error.response");

const MenuService = require("./menu.service");
const ChatRole = require("../enums/chat.role");

class UserService {
    async checkUserExists(username, muatUserId) {
        // * Find user by username or muatUserId
        return User.findOne({
            where: {
                [Op.or]: [
                    {username: username},
                    {muatUserId: muatUserId}
                ]
            }
        });
    }

    async getOpponentUsers(role) {
        let roleOpponent = await MenuService.getOppositeRole(role);
        return User.findAll({
            where: {
                role: roleOpponent
            }
        });
    }

    async createUser(username, muatUserId, companyName, role) {
        // * First check if user exists
        const existingUser = await this.checkUserExists(username, muatUserId, companyName, role);
        if (existingUser) {
            return existingUser; // Return existing user instead of creating new one
        }

        // * Create new user
        return await User.create({
            username: username,
            muatUserId: muatUserId,
            companyName: companyName,
            role: role
        });
    }

    async getAllUsers(name) {
        // * Find all users
        const whereClause = name ? {
            where: {
                [Op.or]: [
                    {username: {[Op.iLike]: `%${name}%`}},
                    {companyName: {[Op.iLike]: `%${name}%`}}
                ]
            }
        } : {};

        return User.findAll({
            ...whereClause,
            order: [['createdAt', 'ASC']]
        });
    }

    async getOnlineUsers() {
        return Array.from(onlineUsers.keys());
    }

    async updateUser(muatId, username, companyName) {
        // * Validate if user exists
        const existingUser = await User.findOne({
            where: {
                muatUserId: muatId
            }
        });
        if (!existingUser) {
            throw new ResponseError(404, 'User not found');
        }

        // * Update user by userId
        return await User.update({
            username: username,
            companyName: companyName,
            lastNameChange: new Date(),
            nameChangesCount: existingUser.nameChangesCount + 1
        }, {
            where: {
                muatUserId: muatId
            }
        });
    }

    async getAllUsersByRole(role) {
        return User.findAll({
            where: {
                role
            }
        });
    }

    async getAllConnectedUsers(searchTerm, viewAs, subMenuId, currentUserId) {
        // * Find opposite role
        const opponentRole = await MenuService.getOppositeRole(viewAs);

        // * Filter
        let filter = {};
        if (searchTerm) {
            if (opponentRole === ChatRole.BUYER) {
                filter = {
                    username: {
                        [Op.iLike]: `%${searchTerm}%`
                    }
                }
            } else if (opponentRole === ChatRole.SELLER) {
                filter = {
                    companyName: {
                        [Op.iLike]: `%${searchTerm}%`
                    }
                }
            }
        }

        return await User.findAll({
            where: {
                ...filter,
                role: opponentRole,
                [Op.or]: [
                    {'$initiatedChats.id$': {[Op.ne]: null}},
                    {'$receivedChats.id$': {[Op.ne]: null}}
                ]
            },
            include: [
                {
                    model: ChatRoom,
                    as: 'initiatedChats',
                    required: false,
                    where: {
                        subMenuId: subMenuId,
                        [Op.or]: [
                            {
                                // When opponent is initiator, current user is recipient
                                initiatorRole: opponentRole,
                                recipientRole: viewAs,
                                recipient: currentUserId
                            },
                            {
                                // When opponent is recipient, current user is initiator
                                initiatorRole: viewAs,
                                recipientRole: opponentRole,
                                initiator: currentUserId
                            }
                        ]
                    },
                    attributes: []
                },
                {
                    model: ChatRoom,
                    as: 'receivedChats',
                    required: false,
                    where: {
                        subMenuId: subMenuId,
                        [Op.or]: [
                            {
                                // When opponent is initiator, current user is recipient
                                initiatorRole: opponentRole,
                                recipientRole: viewAs,
                                recipient: currentUserId
                            },
                            {
                                // When opponent is recipient, current user is initiator
                                initiatorRole: viewAs,
                                recipientRole: opponentRole,
                                initiator: currentUserId
                            }
                        ]
                    },
                    attributes: []
                }
            ],
            attributes: ['id', 'companyName', 'username'],
            group: ['User.id'],
            raw: true
        });
    }

    async updateUserLastSeen(userId) {
        return await User.update({
            lastSeen: new Date()
        }, {
            where: {
                id: userId
            }
        });
    }

    async getUserById(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ResponseError(404, 'User not found');
        }
        user.setDataValue('chatRoles', [ChatRole.BUYER, ChatRole.SELLER, ChatRole.SHIPPER, ChatRole.TRANSPORTER]);
        return user;
    }

    async checkUserRole(userId, role) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ResponseError(404, 'User not found');
        }
        return user.role === role;
    }
}

module.exports = new UserService();