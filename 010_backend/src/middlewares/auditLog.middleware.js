const { logEvent } = require('../utils/auditLog.service');

/**
 * Returns an Express middleware that logs a named audit event
 * after the response is sent (non-blocking).
 *
 * Usage in routes:
 *   router.get('/:id/download', authMiddleware, auditMiddleware('FILE_DOWNLOAD', 'File', req => req.params.id), fileController.download);
 *
 * @param {string} action  - Action name, e.g. 'FILE_DOWNLOAD'
 * @param {string} entity  - Entity type, e.g. 'File'
 * @param {function} [getEntityId]  - Optional fn(req) => entityId
 */
const auditMiddleware = (action, entity, getEntityId = null) => {
    return (req, _res, next) => {
        // Hook into response finish so we don't block the request
        _res.on('finish', () => {
            // Only log successful responses (2xx / 3xx)
            if (_res.statusCode >= 400) return;

            logEvent({
                action,
                entity,
                entityId: getEntityId ? getEntityId(req) : null,
                userId: req.user?.id ?? null,
                req,
            });
        });
        next();
    };
};

module.exports = { auditMiddleware };
