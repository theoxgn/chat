const SuccessResponse = require('../response/success.response');

// * Import Service
const MenuService = require('../service/menu.service');

class MenuController {
    async getAllMenusByUser(req, res, next) {
        try {
            const {userId} = req.params;
            const {viewAs} = req.query;
            const result = await MenuService.getAllMenusByUser(userId, viewAs);
            return await SuccessResponse.toJSON(req, res, 200, 'Menus retrieved successfully', result);

        } catch (error) {
            next(error);
        }
    }

    async favoriteSubMenu(req, res, next) {
        try {
            const {subMenuId} = req.params;
            const {userId} = req.query;
            const result = await MenuService.favoriteSubMenu(subMenuId, userId);
            return await SuccessResponse.toJSON(req, res, 200, 'Favorite', result);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MenuController();
