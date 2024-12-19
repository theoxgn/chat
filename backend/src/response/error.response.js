class ResponseError extends Error {
    constructor(status, data = null, message = null, type = null) {
        super(message);
        this.status = status;
        this.message = message;
        this.data = data;
        this.type = type;
    }
}

module.exports = ResponseError;