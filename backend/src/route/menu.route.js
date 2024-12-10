const {Router} = require('express');
const menuRouter = Router();

// * Import controller
const MenuController = require('../controller/menu.controller');

// * Menu endpoint
menuRouter.get('/api/menus/:userId', MenuController.getAllMenusByUser);

module.exports = menuRouter;