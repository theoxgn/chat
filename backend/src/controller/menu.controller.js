const SuccessResponse = require('../response/success.response');

// * Import Service
const MenuService = require('../service/menu.service');

class MenuController {
    async getAllMenusByUser(req, res, next) {
        try {
            const {userId} = req.params;
            const result = await MenuService.getAllMenusByUser(userId);
            return await SuccessResponse.toJSON(req, res, 200, 'Menus retrieved successfully', result);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MenuController();
