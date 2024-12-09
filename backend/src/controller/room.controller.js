// * Import Service
const RoomService = require('../service/room.service');

class RoomController {
    async createOrFindRoom(req, res, next) {
        try {
            const {user1Id, user2Id} = req.body;
            const result = await RoomService.createOrFindRoom(user1Id, user2Id);
            res.json(result);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoomController();