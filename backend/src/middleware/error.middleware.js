const ErrorResponse = require('../response/error.response');

const errorMiddleware = async (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }
    console.log(`Error: ${err}`);
    if (err instanceof ErrorResponse) {
        let message = err.message;
        res.status(err.statusCode).json({
            statusCode: err.statusCode,
            success: false,
            message: message,
            data: err.details,
            timestamps: new Date().toISOString(),
            path: req.originalUrl
        }).end();
    } else {
        res.status(500).json({
            statusCode: 500,
            success: false,
            message: "Internal server error",
            data: err.message,
            timestamps: new Date().toISOString(),
            path: req.originalUrl
        }).end();

    }
}

module.exports = {errorMiddleware};
