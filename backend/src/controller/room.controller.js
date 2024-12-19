const SuccessResponse = require('../response/success.response');

// * Import Service
const RoomService = require('../service/room.service');

class RoomController {
    async createOrFindRoom(req, res, next) {
        try {
            const {initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName, message} = req.body;
            const result = await RoomService.createOrFindRoom(initiatorId, recipientId, initiatorRole, recipientRole, menuName, subMenuName, message);
            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoomController();