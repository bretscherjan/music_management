/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 */
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let error = undefined;

    // Handle specific error types

    // Zod Validation Errors
    if (err.issues) {
        statusCode = 400;
        message = 'Validation Error';
        error = err.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }));
    }

    // Prisma errors
    if (err.code) {
        switch (err.code) {
            case 'P2002':
                // Unique constraint violation
                statusCode = 409;
                message = 'A record with this value already exists';
                const target = err.meta?.target;
                error = `Duplicate field: ${Array.isArray(target) ? target.join(', ') : target}`;
                break;
            case 'P2025':
                // Record not found
                statusCode = 404;
                message = 'Record not found';
                error = err.meta?.cause || 'The requested resource does not exist';
                break;
            case 'P2003':
                // Foreign key constraint violation
                statusCode = 400;
                message = 'Related record not found';
                error = err.meta?.field_name;
                break;
            default:
                // Other Prisma errors
                if (err.code.startsWith('P')) {
                    statusCode = 400;
                    message = 'Database operation failed';
                    // always include error message to help troubleshoot production issues
                    error = err.message;
                    logger.error({
                        source: 'Database',
                        action: 'DB_ERROR',
                        info: `${err.code} – ${err.message?.slice(0, 120)}`,
                    });
                }
        }
    }

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File too large';
        error = `Maximum file size is ${process.env.MAX_FILE_SIZE || 10485760} bytes`;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected file field';
        error = err.field;
    }

    // JWT errors (shouldn't reach here, but just in case)
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Always log the error (includes 4xx) so we can inspect failed operations later.
    // Prefer userId, fall back to ip and also capture an email from the request body if present.
    {
        const userId = req.user?.id ?? null;
        const ip     = req.ip || req.connection?.remoteAddress || null;
        const email  = req.body?.email || null;
        logger.error({
            ...(userId ? { userId } : { ip }),
            ...(email ? { email } : {}),
            action: statusCode >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR',
            info: `${req.method} ${req.originalUrl} – ${err.message?.slice(0, 120)}`,
            error: err, // let logger buildEntry append message/stack
        });
    }

    // Send response
    const response = {
        message,
        ...(error && { error }),
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    };

    res.status(statusCode).json(response);
};

/**
 * Custom Application Error Class
 * Use this to throw errors with specific status codes
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    AppError,
    asyncHandler
};
