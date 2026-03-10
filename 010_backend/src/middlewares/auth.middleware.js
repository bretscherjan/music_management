const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Authentication required',
                error: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type && decoded.type !== 'access') {
            return next();
        }

        if (decoded.type && decoded.type !== 'access') {
            return res.status(401).json({
                message: 'Invalid token',
                error: 'Refresh token cannot access protected resources'
            });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastSeenAt: true,
                registerId: true,
                register: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                error: 'Invalid token'
            });
        }

        // Check if user is still active
        if (user.status === 'former') {
            return res.status(403).json({
                message: 'Account deactivated',
                error: 'User account is no longer active'
            });
        }

        // Attach user to request
        req.user = user;

        // Throttled lastSeenAt update (fire-and-forget, max once per 5 min)
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!user.lastSeenAt || user.lastSeenAt < fiveMinAgo) {
            prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Invalid token',
                error: error.message
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired',
                error: 'Please login again'
            });
        }
        next(error);
    }
};

/**
 * Refresh Token Middleware
 * Verifies refresh token and attaches user to request
 */
const refreshTokenMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Authentication required',
                error: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                message: 'Invalid token',
                error: 'Access token cannot be used to refresh'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastSeenAt: true,
                registerId: true,
                register: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                error: 'Invalid token'
            });
        }

        if (user.status === 'former') {
            return res.status(403).json({
                message: 'Account deactivated',
                error: 'User account is no longer active'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Invalid token',
                error: error.message
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired',
                error: 'Please login again'
            });
        }
        next(error);
    }
};

/**
 * Optional Auth Middleware
 * Attaches user to request if valid token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastSeenAt: true,
                registerId: true
            }
        });

        if (user && user.status !== 'former') {
            req.user = user;
            // Throttled lastSeenAt update (fire-and-forget)
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (!user.lastSeenAt || user.lastSeenAt < fiveMinAgo) {
                prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
            }
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
};

module.exports = {
    authMiddleware,
    optionalAuth,
    refreshTokenMiddleware
};
