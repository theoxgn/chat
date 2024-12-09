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
            Message: {
                Code: err.statusCode,
                Text: message
            },
            Data: {
                Message: err.details
            },
            Type: req.originalUrl
        }).end();
    } else {
        res.status(500).json({
            Message: {
                Code: 500,
                Text: "Internal Server Error"
            },
            Data: {
                Message: err.message
            },
            Type: req.originalUrl
        }).end();

    }
}

module.exports = {errorMiddleware};
