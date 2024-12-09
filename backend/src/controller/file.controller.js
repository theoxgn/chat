// * Import Service
const FileService = require('../service/file.service');
const ErrorResponse = require("../response/error.response");

class FileController {
    async uploadFile(req, res, next) {
        try {
            if (!req.file) {
                throw new ErrorResponse(400, "Bad Request", "File is required");
            }

            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            const result = await FileService.uploadFile(fileUrl, req.file);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FileController();
