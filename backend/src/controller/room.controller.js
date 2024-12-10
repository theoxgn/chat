const SuccessResponse = require('../response/success.response');

// * Import Service
const RoomService = require('../service/room.service');

class RoomController {
    async createOrFindRoom(req, res, next) {
        try {
            const {initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName} = req.body;
            const result = await RoomService.createOrFindRoom(initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName);
            return await SuccessResponse.toJSON(req, res, 201, 'Room created successfully', result);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoomController();