const onlineUsers = require("../store/onlineUsers.store");
const {User} = require('../../models');
const {Op} = require("sequelize");

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

    async createUser(username, muatUserId) {
        // * First check if user exists
        const existingUser = await this.checkUserExists(username, muatUserId);
        if (existingUser) {
            return existingUser; // Return existing user instead of creating new one
        }

        // * Create new user
        return User.create({
            username: username,
            muatUserId: muatUserId
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
}

module.exports = new UserService();