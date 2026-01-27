const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

/**
 * Get audit logs with filtering and pagination
 * GET /api/audit
 */
const getAuditLogs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        action,
        entity,
        userId,
        search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter conditions
    const where = {};

    if (startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
        where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    if (action) where.action = action;
    if (entity) where.entity = entity;

    if (userId) {
        where.userId = parseInt(userId);
    }

    // Search in Entity ID or Metadata (if text search is needed)
    // Basic search implementation for entityId or values
    if (search) {
        where.OR = [
            { entityId: { contains: search } }, // Only if entityId is string, but it's consistent string in DB usually? DB schema says String.
            // Value search is harder with JSON types in simple query, but let's try basic text match if supported or skip
        ];
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take
        }),
        prisma.auditLog.count({ where })
    ]);

    res.json({
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / take)
        }
    });
});

/**
 * Get available filter options (actions, entities)
 * GET /api/audit/filters
 */
const getAuditFilters = asyncHandler(async (req, res) => {
    // Get unique actions and entities
    // Using simple aggregations or hardcoded lists if cleaner
    // DB aggregation is better for truth

    const actions = await prisma.auditLog.groupBy({
        by: ['action'],
    });

    const entities = await prisma.auditLog.groupBy({
        by: ['entity'],
    });

    res.json({
        actions: actions.map(a => a.action),
        entities: entities.map(e => e.entity)
    });
});

module.exports = {
    getAuditLogs,
    getAuditFilters
};
