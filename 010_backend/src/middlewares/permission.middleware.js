const logger = require('../utils/logger');

/**
 * Permission Check Middleware Factory
 * Creates middleware that checks if user has a specific permission
 * 
 * @param {string} permissionKey - The key of the permission to check
 * @returns {Function} Express middleware function
 */
const permissionCheck = (permissionKey) => {
    return (req, res, next) => {
        // Ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
        }

        // Admins always have all permissions
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user has the required permission
        const hasPermission = req.user.permissions && req.user.permissions.some(p => p.permission.key === permissionKey);

        if (!hasPermission) {
            logger.warn({
                userId: req.user.id,
                action: 'PERMISSION_DENIED',
                info: `${req.method} ${req.originalUrl} – needs permission '${permissionKey}'`,
            });
            return res.status(403).json({
                message: 'Access denied',
                error: `Missing required permission: ${permissionKey}`
            });
        }

        next();
    };
};

module.exports = {
    permissionCheck
};
