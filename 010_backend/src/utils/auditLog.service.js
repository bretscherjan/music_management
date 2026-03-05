const prisma = require('./prisma');

/**
 * Write an audit log entry fire-and-forget (non-blocking).
 *
 * @param {object} params
 * @param {string} params.action   - e.g. 'LOGIN', 'FILE_DOWNLOAD', 'ATTENDANCE_UPDATE'
 * @param {string} params.entity   - e.g. 'User', 'File', 'Attendance'
 * @param {string|number|null} [params.entityId]
 * @param {number|null} [params.userId]
 * @param {object|null} [params.req]  - Express request (for IP / userAgent)
 * @param {any} [params.oldValue]
 * @param {any} [params.newValue]
 */
const logEvent = ({ action, entity, entityId = null, userId = null, req = null, ip = null, userAgent = null, oldValue = null, newValue = null }) => {
    const finalIp = ip || (req ? (req.ip || req.connection?.remoteAddress || null) : null);
    const finalUserAgent = userAgent || (req ? (req.get('User-Agent') || null) : null);

    // Create audit log entry
    prisma.auditLog.create({
        data: {
            action,
            entity,
            entityId: entityId != null ? String(entityId) : null,
            userId,
            ipAddress: finalIp,
            userAgent: finalUserAgent,
            oldValue: oldValue ?? undefined,
            newValue: newValue ?? undefined,
        }
    }).catch(err => {
        // Never let audit logging crash the main request
        console.error('[AuditLog] Failed to write event:', err.message);
    });

    // Update user's lastSeenAt on every action (fallback mechanism)
    if (userId) {
        prisma.user.update({
            where: { id: userId },
            data: { lastSeenAt: new Date() }
        }).catch(err => {
            // Never let this crash the main request
            console.error('[AuditLog] Failed to update lastSeenAt:', err.message);
        });
    }
};

module.exports = { logEvent };
