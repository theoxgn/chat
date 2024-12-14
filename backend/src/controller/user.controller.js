const ErrorResponse = require("../response/error.response");
const SuccessResponse = require("../response/success.response");
const UserService = require("../service/user.service");

class UserController {
    async createUser(req, res, next) {
        try {
            const {username, muatUserId} = req.body;
            if (!username) {
                throw new ErrorResponse(400, "Bad Request", "Username is required");
            }

            const result = await UserService.createUser(username, muatUserId);
            return SuccessResponse.toJSON(req, res, 201, 'User created successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(req, res, next) {
        try {
            const {
                name
            } = req.query;
            const result = await UserService.getAllUsers(name);
            return SuccessResponse.toJSON(req, res, 200, 'Users retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req, res, next) {
        try {
            const {muatUserId, username, companyName} = req.body;
            const result = await UserService.updateUser(muatUserId, username, companyName);
            return SuccessResponse.toJSON(req, res, 200, 'User updated successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async getOnlineUsers(req, res, next) {
        try {
            const result = await UserService.getOnlineUsers();
            return SuccessResponse.toJSON(req, res, 200, 'Online users retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();