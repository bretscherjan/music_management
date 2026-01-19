/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 */
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
                    error = process.env.NODE_ENV === 'development' ? err.message : undefined;
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
