// * Import Service
const RoomService = require('../service/room.service');

class RoomController {
    async createOrFindRoom(req, res, next) {
        try {
            const {initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName} = req.body;
            const result = await RoomService.createOrFindRoom(initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName);
            res.json(result);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoomController();