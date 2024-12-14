// * Import the express router
const {Router} = require('express');

// * Import Controller
const UserController = require('../controller/user.controller');

// * Create a new router
const userRouter = Router();

userRouter.post('/api/users', UserController.createUser);
userRouter.get('/api/users', UserController.getAllUsers);
userRouter.put('/api/users', UserController.updateUser);
userRouter.get('/api/users/online', UserController.getOnlineUsers);

module.exports = userRouter;
