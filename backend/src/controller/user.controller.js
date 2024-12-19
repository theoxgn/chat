const ResponseError = require("../response/error.response");
const SuccessResponse = require("../response/success.response");
const UserService = require("../service/user.service");

class UserController {
    async createUser(req, res, next) {
        try {
            const {username, muatUserId, companyName, role} = req.body;
            if (!username) {
                throw new ResponseError(400, "Username is required");
            }

            const result = await UserService.createUser(username, muatUserId, companyName, role);
            return await SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
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
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async getAllUsersByRole(req, res, next) {
        try {
            const {
                role
            } = req.query;
            const result = await UserService.getAllUsersByRole(role);
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async getOpponentUsers(req, res, next) {
        try {
            const {
                role
            } = req.query;
            const result = await UserService.getOpponentUsers(role);
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req, res, next) {
        try {
            const {muatUserId, username, companyName} = req.body;
            const result = await UserService.updateUser(muatUserId, username, companyName);
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async getOnlineUsers(req, res, next) {
        try {
            const result = await UserService.getOnlineUsers();
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await UserService.getUserById(userId);
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async checkUserRole(req, res, next) {
        try {
            const {userId} = req.params;
            const {role} = req.query;
            const result = await UserService.checkUserRole(userId, role);
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }

    async changeNameCheck(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await UserService.changeNameCheck(userId);
            return SuccessResponse.showMessage(200, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();