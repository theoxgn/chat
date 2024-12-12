const {Router} = require('express');
const menuRouter = Router();

// * Import controller
const MenuController = require('../controller/menu.controller');

// * Menu endpoint
menuRouter.get('/api/menus/:userId', MenuController.getAllMenusByUser);
menuRouter.post('/api/menus/:subMenuId/favorite', MenuController.favoriteSubMenu);
// menuRouter.get('/api/menus/:userId/favorite', MenuController.getAllMenusFavoriteByUser);


module.exports = menuRouter;