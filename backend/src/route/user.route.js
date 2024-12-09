// * Import the express router
const {Router} = require('express');
const pool = require('../config/postgres');

// * Import Controller
const UserController = require('../controller/user.controller');

// * Create a new router
const userRouter = Router();

userRouter.post('/api/users', UserController.createUser);
userRouter.get('/api/users', UserController.getAllUsers);
userRouter.get('/api/users/online', UserController.getOnlineUsers);

module.exports = userRouter;
