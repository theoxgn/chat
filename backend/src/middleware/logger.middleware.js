const winston = require('winston');
const expressWinston = require('express-winston');
const path = require('path');

// Konfigurasi format logging
const logFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.json()
);

// Konfigurasi logger
const logger = winston.createLogger({
    format: logFormat,
    transports: [
        // Log ke file
        new winston.transports.File({
            filename: path.join(__dirname, 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, 'logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Log ke console pada environment development
        ...(process.env.NODE_ENV !== 'production'
            ? [new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })]
            : [])
    ]
});

// Middleware untuk logging HTTP requests
const requestLogger = expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: process.env.NODE_ENV !== 'production',
    // Mengabaikan logging untuk path tertentu
    ignoreRoute: (req, res) => {
        return req.url.includes('/health') || req.url.includes('/metrics');
    }
});

// Middleware untuk logging error
const errorLogger = expressWinston.errorLogger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}} {{err.message}}',
    // Custom handler untuk error
    dynamicMeta: (req, res, err) => {
        return {
            user: req.user ? req.user.id : null,
            correlationId: req.headers['x-correlation-id'],
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
        };
    }
});

module.exports = {
    requestLogger,
    errorLogger,
    logger
};