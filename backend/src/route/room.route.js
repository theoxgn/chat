// * Import the express router
const {Router} = require('express');

// * Import Controller
const RoomController = require('../controller/room.controller');

const roomRouter = Router();
roomRouter.post('/api/rooms', RoomController.createOrFindRoom);

module.exports = roomRouter;