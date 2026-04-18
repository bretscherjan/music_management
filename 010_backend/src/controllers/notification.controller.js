const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

const VALID_CATEGORIES = ['EVENTS', 'NEWS', 'POLLS'];

/**
 * GET /notifications/unread-counts
 * Returns unread counts for CHAT, EVENTS, NEWS, and POLLS for the current user.
 * Also returns lastCheckedAt per category for frontend item-level dot comparison.
 */
const getUnreadCounts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // ── Chat: sum unreadCount across all chats where user is participant ────
    const chatUnread = await prisma.chatReadState.aggregate({
        where: { userId, unreadCount: { gt: 0 } },
        _sum: { unreadCount: true },
    });
    const chatCount = chatUnread._sum.unreadCount ?? 0;

    // ── Fetch the user's read states for EVENTS / NEWS / POLLS ─────────────
    const readStates = await prisma.userCategoryReadState.findMany({
        where: { userId },
    });
    const stateMap = {};
    readStates.forEach(s => {
        stateMap[s.category] = s.lastCheckedAt;
    });

    const epochStart = new Date(0);
    const eventsLastChecked  = stateMap['EVENTS'] ?? epochStart;
    const newsLastChecked    = stateMap['NEWS']   ?? epochStart;
    const pollsLastChecked   = stateMap['POLLS']  ?? epochStart;

    // ── Events: count events visible to user created/updated after lastChecked ─
    const userRegisterId = req.user.registerId;
    const eventWhere = {
        updatedAt: { gt: eventsLastChecked },
        OR: [
            { visibility: 'all' },
            ...(isAdmin ? [{ visibility: 'admin' }] : []),
            ...(userRegisterId
                ? [{ visibility: 'register', targetRegisters: { some: { id: userRegisterId } } }]
                : []),
        ],
    };
    const eventsCount = await prisma.event.count({ where: eventWhere });

    // ── News: count news created/updated after lastChecked ──────────────────
    const newsCount = await prisma.news.count({
        where: { updatedAt: { gt: newsLastChecked } },
    });

    // ── Polls: count polls visible to user updated after lastChecked ─────────
    const pollWhere = {
        updatedAt: { gt: pollsLastChecked },
        OR: [
            { audienceRules: { some: { targetType: 'ALL' } } },
            ...(isAdmin ? [] : []),
            { audienceRules: { some: { targetType: 'USER', userId } } },
            ...(userRegisterId
                ? [{ audienceRules: { some: { targetType: 'REGISTER', registerId: userRegisterId } } }]
                : []),
        ],
    };
    const pollsCount = await prisma.poll.count({ where: pollWhere });

    res.json({
        counts: {
            chat: chatCount,
            events: eventsCount,
            news: newsCount,
            polls: pollsCount,
        },
        lastCheckedAt: {
            events: stateMap['EVENTS'] ?? null,
            news:   stateMap['NEWS']   ?? null,
            polls:  stateMap['POLLS']  ?? null,
        },
    });
});

/**
 * POST /notifications/mark-read
 * Body: { category: 'EVENTS' | 'NEWS' | 'POLLS' }
 * Upserts UserCategoryReadState for the current user, setting lastCheckedAt = now().
 */
const markCategoryRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { category } = req.body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    await prisma.userCategoryReadState.upsert({
        where: { userId_category: { userId, category } },
        update: { lastCheckedAt: new Date() },
        create: { userId, category, lastCheckedAt: new Date() },
    });

    res.json({ ok: true });
});

module.exports = { getUnreadCounts, markCategoryRead };
