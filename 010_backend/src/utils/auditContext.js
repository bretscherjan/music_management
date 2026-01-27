const { AsyncLocalStorage } = require('async_hooks');

const auditContextStorage = new AsyncLocalStorage();

/**
 * Middleware to initialize audit context
 */
const initAuditContext = (req, res, next) => {
    const context = {
        userId: req.user ? req.user.id : null,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };

    auditContextStorage.run(context, () => {
        next();
    });
};

/**
 * Get current audit context
 */
const getAuditContext = () => {
    return auditContextStorage.getStore();
};

module.exports = {
    initAuditContext,
    getAuditContext
};
