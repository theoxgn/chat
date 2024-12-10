class SuccessResponse {
    async toJSON(req, res, statusCode, message, data) {
        res.status(statusCode).json({
            statusCode: statusCode,
            success: true,
            message: message,
            data: data,
            timestamps: new Date().toISOString(),
            path: req.originalUrl
        });
    }
}

module.exports = new SuccessResponse();
