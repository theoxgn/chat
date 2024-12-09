const ErrorResponse = require("../response/error.response");
const UserService = require("../service/user.service");

class UserController {
    async createUser(req, res, next) {
        try {
            const {username} = req.body;
            if (!username) {
                throw new ErrorResponse(400, "Bad Request", "Username is required");
            }

            const result = await UserService.createUser(username);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(req, res, next) {
        try {
            const result = await UserService.getAllUsers();
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getOnlineUsers(req, res, next) {
        try {
            const result = await UserService.getOnlineUsers();
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();