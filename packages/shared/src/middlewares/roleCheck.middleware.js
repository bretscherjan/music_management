const logger = require('../utils/logger');

/**
 * Role Check Middleware Factory
 * Creates middleware that checks if user has one of the allowed roles
 * 
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only admins can access
 * router.post('/admin-action', authMiddleware, roleCheck('admin'), handler);
 * 
 * // Both admins and members can access
 * router.get('/resource', authMiddleware, roleCheck('admin', 'member'), handler);
 */
const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            logger.warn({
                userId: req.user.id,
                action: 'ACCESS_DENIED',
                info: `${req.method} ${req.originalUrl} – needs [${allowedRoles.join('|')}], has '${req.user.role}'`,
            });
            return res.status(403).json({
                message: 'Access denied',
                error: `Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
            });
        }

        next();
    };
};

/**
 * Admin Only Middleware
 * Convenience middleware that only allows admin users
 */
const adminOnly = roleCheck('admin');

/**
 * Active Member Middleware
 * Ensures the user is an active member (not passive or former)
 */
const activeMemberOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Authentication required',
            error: 'User not authenticated'
        });
    }

    if (req.user.status !== 'active') {
        return res.status(403).json({
            message: 'Active membership required',
            error: `Your status (${req.user.status}) does not allow this action`
        });
    }

    next();
};

module.exports = {
    roleCheck,
    adminOnly,
    activeMemberOnly
};
