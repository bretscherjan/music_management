const prisma = require('../utils/prisma');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const { getOnlineUsersList } = require('../services/websocket.service');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const toNum = v => Number(v);
const sinceDate = days => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function roleFilter(role) {
    if (!role || role === 'all') return { joinClause: '', whereClause: '' };
    const safeRole = role === 'admin' ? 'admin' : 'member';
    return {
        joinClause: 'JOIN User u ON al.userId = u.id',
        whereClause: `AND u.role = '${safeRole}'`,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Action taxonomy for interaction-type filter
// ─────────────────────────────────────────────────────────────────────────────

const INTERACTION_ACTIONS = `('FILE_DOWNLOAD','FILE_PREVIEW','FILE_ACCESS','ATTENDANCE_UPDATE','MUSIC_FOLDER_OPEN','MUSIC_FOLDER_ZIP_DOWNLOAD','SHEET_MUSIC_VIEW')`;
const VISIT_ACTIONS = `('EVENT_VIEW','LOGIN')`;

// ─────────────────────────────────────────────────────────────────────────────
// Existing log endpoints
// ─────────────────────────────────────────────────────────────────────────────

const getAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, startDate, endDate, action, entity, userId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = parseInt(userId);
    if (search) where.OR = [{ entityId: { contains: search } }];

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma.auditLog.count({ where }),
    ]);
    res.json({ logs, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } });
});

const getAuditFilters = asyncHandler(async (req, res) => {
    const [actions, entities] = await Promise.all([
        prisma.auditLog.groupBy({ by: ['action'] }),
        prisma.auditLog.groupBy({ by: ['entity'] }),
    ]);
    res.json({ actions: actions.map(a => a.action), entities: entities.map(e => e.entity) });
});

// ─────────────────────────────────────────────────────────────────────────────
// Analytics endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/audit/analytics/peak-times?days=90&role=all|member|admin */
const getPeakTimes = asyncHandler(async (req, res) => {
    const days = Math.max(1, parseInt(req.query.days) || 90);
    const since = sinceDate(days);
    const { joinClause, whereClause } = roleFilter(req.query.role);

    const [byHour, byWeekday] = await Promise.all([
        prisma.$queryRawUnsafe(`
            SELECT HOUR(al.createdAt) AS hour, COUNT(*) AS count
            FROM AuditLog al ${joinClause}
            WHERE al.createdAt >= ? ${whereClause}
            GROUP BY hour ORDER BY hour`, since),
        prisma.$queryRawUnsafe(`
            SELECT DAYOFWEEK(al.createdAt) AS dayOfWeek, COUNT(*) AS count
            FROM AuditLog al ${joinClause}
            WHERE al.createdAt >= ? ${whereClause}
            GROUP BY dayOfWeek ORDER BY dayOfWeek`, since),
    ]);

    const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const hours = Array.from({ length: 24 }, (_, h) => {
        const f = byHour.find(r => Number(r.hour) === h);
        return { hour: h, count: f ? toNum(f.count) : 0 };
    });
    const weekdays = Array.from({ length: 7 }, (_, i) => {
        const f = byWeekday.find(r => Number(r.dayOfWeek) === i + 1);
        return { dayOfWeek: i + 1, label: DAY_NAMES[i], count: f ? toNum(f.count) : 0 };
    });
    res.json({ hours, weekdays });
});

/** GET /api/audit/analytics/feature-usage?days=30&role=all|member|admin&registerId=1&type=all|interaction|visit */
const getFeatureUsage = asyncHandler(async (req, res) => {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const since = sinceDate(days);
    const registerId = req.query.registerId ? parseInt(req.query.registerId) : null;
    const type = req.query.type || 'all'; // 'all' | 'interaction' | 'visit'
    const needsJoin = (req.query.role && req.query.role !== 'all') || registerId;
    const { joinClause, whereClause } = roleFilter(req.query.role);
    const userJoin = needsJoin && !joinClause ? 'JOIN User u ON al.userId = u.id' : joinClause;
    const regWhere = registerId ? `AND u.registerId = ${registerId}` : '';
    const typeWhere = type === 'interaction'
        ? `AND al.action IN ${INTERACTION_ACTIONS}`
        : type === 'visit'
            ? `AND al.action IN ${VISIT_ACTIONS}`
            : '';

    const rows = await prisma.$queryRawUnsafe(`
        SELECT al.action, al.entity, COUNT(*) AS count
        FROM AuditLog al ${userJoin}
        WHERE al.createdAt >= ? ${whereClause} ${regWhere} ${typeWhere}
        GROUP BY al.action, al.entity
        ORDER BY count DESC`, since);

    res.json(rows.map(r => ({ action: r.action, entity: r.entity, count: toNum(r.count) })));
});

/** GET /api/audit/analytics/online-now?minutes=15 */
const getOnlineNow = asyncHandler(async (req, res) => {
    const minutes = Math.max(1, Math.min(60, parseInt(req.query.minutes) || 15));
    const since = new Date(Date.now() - minutes * 60 * 1000);

    // ── Primary: WebSocket heartbeat (Real-time, most accurate) ──
    const wsOnlineUsers = getOnlineUsersList();

    // If WebSocket has connected users, use those (they're actively sending heartbeats)
    if (wsOnlineUsers.length > 0) {
        return res.json({
            minutes,
            count: wsOnlineUsers.length,
            users: wsOnlineUsers.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()),
            source: 'websocket' // For debugging
        });
    }

    // ── Fallback: lastSeenAt from database (for users without WebSocket) ──
    const [usersFromLastSeen, auditRows] = await Promise.all([
        prisma.user.findMany({
            where: { lastSeenAt: { gte: since } },
            select: {
                id: true, firstName: true, lastName: true, role: true, lastSeenAt: true,
                register: { select: { name: true } },
            },
        }),
        // Fallback: AuditLog for users who don't have lastSeenAt yet (bootstrap period)
        prisma.$queryRaw`
            SELECT al.userId, u.firstName, u.lastName, u.role,
                   r.name AS registerName, MAX(al.createdAt) AS lastSeen
            FROM AuditLog al
            JOIN User u ON al.userId = u.id
            LEFT JOIN Register r ON u.registerId = r.id
            WHERE al.createdAt >= ${since}
              AND al.userId IS NOT NULL
              AND u.lastSeenAt IS NULL
            GROUP BY al.userId, u.firstName, u.lastName, u.role, r.name`,
    ]);

    const seenIds = new Set(usersFromLastSeen.map(u => u.id));
    const allUsers = [
        ...usersFromLastSeen.map(u => ({
            id: u.id, firstName: u.firstName, lastName: u.lastName,
            role: u.role, register: u.register?.name ?? null, lastSeen: u.lastSeenAt,
        })),
        ...auditRows
            .filter(r => !seenIds.has(toNum(r.userId)))
            .map(r => ({
                id: toNum(r.userId), firstName: r.firstName, lastName: r.lastName,
                role: r.role, register: r.registerName ?? null, lastSeen: r.lastSeen,
            })),
    ].sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    res.json({
        minutes,
        count: allUsers.length,
        users: allUsers,
        source: 'database' // For debugging
    });
});

/** GET /api/audit/analytics/activity-by-register?days=30 */
const getActivityByRegister = asyncHandler(async (req, res) => {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const since = sinceDate(days);

    const rows = await prisma.$queryRaw`
        SELECT r.name AS register, al.action, COUNT(*) AS count
        FROM AuditLog al
        JOIN User u ON al.userId = u.id
        JOIN Register r ON u.registerId = r.id
        WHERE al.createdAt >= ${since}
        GROUP BY r.name, al.action
        ORDER BY count DESC`;

    // Also fetch all registers to include those with no activity
    const allRegisters = await prisma.register.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
    });

    const map = new Map();
    for (const r of rows) {
        if (!map.has(r.register)) map.set(r.register, { register: r.register, _total: 0 });
        map.get(r.register)[r.action] = toNum(r.count);
        map.get(r.register)._total += toNum(r.count);
    }

    // Add registers with no activity
    for (const reg of allRegisters) {
        if (!map.has(reg.name)) {
            map.set(reg.name, { register: reg.name, _total: 0 });
        }
    }

    res.json([...map.values()].sort((a, b) => b._total - a._total));
});

/** GET /api/audit/analytics/top-users?days=30&action=FILE_ACCESS&limit=15 */
const getTopUsers = asyncHandler(async (req, res) => {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const action = req.query.action || null;
    const since = sinceDate(days);
    const actionWhere = action ? `AND al.action = '${action.replace(/[^A-Z_]/g, '')}'` : '';

    const rows = await prisma.$queryRawUnsafe(`
        SELECT u.id, u.firstName, u.lastName, u.role,
               r.name AS registerName,
               COUNT(*)                              AS total,
               SUM(al.action = 'LOGIN')                                          AS logins,
               SUM(al.action IN ('FILE_DOWNLOAD', 'FILE_ACCESS'))                 AS fileDownloads,
               SUM(al.action = 'ATTENDANCE_UPDATE')   AS attendanceUpdates
        FROM AuditLog al
        JOIN User u ON al.userId = u.id
        LEFT JOIN Register r ON u.registerId = r.id
        WHERE al.createdAt >= ? ${actionWhere}
        GROUP BY u.id, u.firstName, u.lastName, u.role, r.name
        ORDER BY total DESC
        LIMIT ?`, since, limit);

    res.json(rows.map(r => ({
        id: toNum(r.id),
        firstName: r.firstName,
        lastName: r.lastName,
        role: r.role,
        register: r.registerName ?? null,
        total: toNum(r.total),
        logins: toNum(r.logins),
        fileDownloads: toNum(r.fileDownloads),
        attendanceUpdates: toNum(r.attendanceUpdates),
    })));
});

/** GET /api/audit/analytics/inactive-users?days=30&role=all|member|admin */
const getInactiveUsers = asyncHandler(async (req, res) => {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const cutoff = sinceDate(days);
    const role = req.query.role && req.query.role !== 'all' ? req.query.role : undefined;

    // Candidates: active users with no recent lastSeenAt
    const candidates = await prisma.user.findMany({
        where: {
            status: 'active',
            ...(role && { role }),
            OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }],
        },
        select: {
            id: true, firstName: true, lastName: true, email: true,
            role: true, lastSeenAt: true,
            register: { select: { name: true } },
        },
    });

    if (candidates.length === 0) {
        return res.json({ days, users: [] });
    }

    // For users with null lastSeenAt, check AuditLog as fallback
    const nullIds = candidates.filter(u => !u.lastSeenAt).map(u => u.id);
    let auditLastSeen = [];
    if (nullIds.length > 0) {
        const placeholders = nullIds.map(() => '?').join(',');
        auditLastSeen = await prisma.$queryRawUnsafe(
            `SELECT userId, MAX(createdAt) AS lastSeen FROM AuditLog WHERE userId IN (${placeholders}) GROUP BY userId`,
            ...nullIds
        );
    }

    const auditMap = new Map(auditLastSeen.map(r => [toNum(r.userId), r.lastSeen]));

    const now = Date.now();
    const users = candidates
        .map(u => {
            const effectiveLastSeen = u.lastSeenAt ?? auditMap.get(u.id) ?? null;
            return {
                ...u,
                lastSeenAt: effectiveLastSeen,
                daysInactive: effectiveLastSeen
                    ? Math.floor((now - new Date(effectiveLastSeen).getTime()) / 86_400_000)
                    : null,
            };
        })
        // Re-filter: exclude users whose AuditLog shows recent activity
        .filter(u => u.daysInactive === null || u.daysInactive >= days)
        .sort((a, b) => {
            if (a.lastSeenAt === null && b.lastSeenAt === null) return 0;
            if (a.lastSeenAt === null) return 1;  // null → bottom
            if (b.lastSeenAt === null) return -1;
            return new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime();
        });

    res.json({ days, users });
});

/** GET /api/audit/analytics/newly-registered?days=30&role=all|member|admin */
const getNewlyRegisteredUsers = asyncHandler(async (req, res) => {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const since = sinceDate(days);
    const role = req.query.role && req.query.role !== 'all' ? req.query.role : undefined;

    const users = await prisma.user.findMany({
        where: {
            status: 'active',
            createdAt: { gte: since },
            ...(role && { role }),
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
            lastSeenAt: true,
            register: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    const enriched = users.map(u => ({
        ...u,
        createdAt: u.createdAt,
        firstSeenAt: u.lastSeenAt, // When user first logged in
        daysSinceCreation: Math.floor((now - new Date(u.createdAt).getTime()) / 86_400_000),
        isActive: u.lastSeenAt !== null && u.lastSeenAt >= new Date(Date.now() - 24 * 60 * 60 * 1000), // Active today
    }));

    res.json({ days, count: enriched.length, users: enriched });
});

/** GET /api/audit/analytics/all-users-engagement?days=30&role=all|member|admin */
const getAllUsersWithEngagement = asyncHandler(async (req, res) => {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const since = sinceDate(days);
    const role = req.query.role && req.query.role !== 'all' ? req.query.role : undefined;

    // Get all active users
    const allUsers = await prisma.user.findMany({
        where: {
            status: 'active',
            ...(role && { role }),
        },
        select: {
            id: true, firstName: true, lastName: true, email: true,
            role: true, lastSeenAt: true, createdAt: true,
            register: { select: { name: true } },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    if (allUsers.length === 0) {
        return res.json({ days, users: [] });
    }

    // Get engagement stats for all users in one query
    const userIds = allUsers.map(u => u.id);
    const placeholders = userIds.map(() => '?').join(',');
    const engagementRows = await prisma.$queryRawUnsafe(`
        SELECT al.userId,
               COUNT(*)                              AS total,
               SUM(al.action = 'LOGIN')                                          AS logins,
               SUM(al.action IN ('FILE_DOWNLOAD', 'FILE_ACCESS'))                 AS fileDownloads,
               SUM(al.action = 'ATTENDANCE_UPDATE')   AS attendanceUpdates,
               MAX(al.createdAt)                      AS lastActivityAt
        FROM AuditLog al
        WHERE al.createdAt >= ? AND al.userId IN (${placeholders})
        GROUP BY al.userId`, since, ...userIds);

    const engagementMap = new Map();
    for (const row of engagementRows) {
        engagementMap.set(toNum(row.userId), {
            total: toNum(row.total),
            logins: toNum(row.logins),
            fileDownloads: toNum(row.fileDownloads),
            attendanceUpdates: toNum(row.attendanceUpdates),
            lastActivityAt: row.lastActivityAt,
        });
    }

    // For users with null lastSeenAt, check AuditLog as fallback for last seen
    const nullIds = allUsers.filter(u => !u.lastSeenAt).map(u => u.id);
    let auditLastSeen = [];
    if (nullIds.length > 0) {
        const placeholders2 = nullIds.map(() => '?').join(',');
        auditLastSeen = await prisma.$queryRawUnsafe(
            `SELECT userId, MAX(createdAt) AS lastSeen FROM AuditLog WHERE userId IN (${placeholders2}) GROUP BY userId`,
            ...nullIds
        );
    }

    const auditLastSeenMap = new Map(auditLastSeen.map(r => [toNum(r.userId), r.lastSeen]));

    const now = Date.now();
    const users = allUsers.map(u => {
        const engagement = engagementMap.get(u.id) || { total: 0, logins: 0, fileDownloads: 0, attendanceUpdates: 0, lastActivityAt: null };
        // Note: engagement.lastActivityAt is intentionally omitted here – it is
        // scoped to the selected time window and would give a misleading "last seen"
        // date. The authoritative sources are: (1) lastSeenAt on the User record
        // (updated on every login / heartbeat / disconnect) and (2) the unfiltered
        // AuditLog MAX(createdAt) query above.
        const effectiveLastSeen = u.lastSeenAt ?? auditLastSeenMap.get(u.id) ?? null;
        const daysSinceLastSeen = effectiveLastSeen
            ? Math.floor((now - new Date(effectiveLastSeen).getTime()) / 86_400_000)
            : null;

        return {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
            register: u.register?.name ?? null,
            total: engagement.total,
            logins: engagement.logins,
            fileDownloads: engagement.fileDownloads,
            attendanceUpdates: engagement.attendanceUpdates,
            lastSeenAt: effectiveLastSeen,
            daysSinceLastSeen,
            createdAt: u.createdAt,
        };
    });

    res.json({ days, users });
});

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    getAuditLogs, getAuditFilters,
    getPeakTimes, getFeatureUsage,
    getOnlineNow, getActivityByRegister,
    getTopUsers, getInactiveUsers, getNewlyRegisteredUsers, getAllUsersWithEngagement,
};