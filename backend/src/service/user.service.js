const onlineUsers = require("../store/onlineUsers.store");
const {User} = require('../../models');
const {Op} = require("sequelize");
const ErrorResponse = require("../response/error.response");

const MenuService = require("./menu.service");

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
            throw new ErrorResponse(404, 'Not Found', 'User not found');
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
}

module.exports = new UserService();