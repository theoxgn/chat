// * Import Service
const FileService = require('../service/file.service');
const SuccessResponse = require("../response/success.response");

class FileController {
    async uploadFile(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({error: 'No file uploaded'});
            }

            const result = await FileService.uploadFile(req.file);

            return await SuccessResponse.showMessage(201, {
                Data: result,
                Type: req.originalUrl,
            }, true, res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FileController();
