// * Import service
const AdminService = require('../service/admin.service');

class AdminController {
    async resetSequence(req, res, next) {
        try {
            const result = await AdminService.resetSequence();
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();