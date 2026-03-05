const path = require('path');
const fs   = require('fs');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const logger = require('../utils/logger');
const prisma = require('../utils/prisma');

/**
 * Fills in missing email fields for log entries that have a userId.
 * Performs a single batch DB lookup for all affected userIds.
 */
async function enrichEmailsFromDb(entries) {
    const missingIds = [...new Set(
        entries
            .filter(e => e.userId != null && !e.email)
            .map(e => e.userId)
    )];
    if (missingIds.length === 0) return entries;

    const users = await prisma.user.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, email: true },
    });
    const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]));

    return entries.map(e =>
        (e.userId != null && !e.email && emailMap[e.userId])
            ? { ...e, email: emailMap[e.userId] }
            : e
    );
}

const LOG_DIR = path.join(process.cwd(), 'logs');

/**
 * GET /api/logs
 * Returns the most recent log entries from the in-memory buffer.
 * Query params: limit (default 50), level (INFO|WARN|ERROR)
 */
const getLogs = asyncHandler(async (req, res) => {
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const level = req.query.level?.toUpperCase() || null;
    const raw = logger.getBuffer(limit, level);
    const entries = await enrichEmailsFromDb(raw);
    res.json({ count: entries.length, entries });
});

/**
 * GET /api/logs/stats
 * Returns counts per level from the buffer.
 */
const getLogStats = asyncHandler(async (req, res) => {
    res.json(logger.getStats());
});

/**
 * GET /api/logs/date?date=YYYY-MM-DD[&level=INFO|WARN|ERROR][&limit=500]
 * Returns structured log entries from the NDJSON file for a given date.
 */
const getLogsByDate = asyncHandler(async (req, res) => {
    const date = req.query.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Ungültiges Datum. Format: YYYY-MM-DD' });
    }
    const level = req.query.level?.toUpperCase() || null;
    const limit = Math.min(1000, parseInt(req.query.limit) || 500);

    const file = path.join(LOG_DIR, `${date}.ndjson`);
    if (!fs.existsSync(file)) {
        return res.json({ count: 0, entries: [] });
    }

    const content = fs.readFileSync(file, 'utf8');
    let entries = content
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => { try { return JSON.parse(line); } catch { return null; } })
        .filter(Boolean)
        .reverse(); // newest first

    if (level) entries = entries.filter(e => e.level === level);
    entries = entries.slice(0, limit);
    entries = await enrichEmailsFromDb(entries);

    res.json({ count: entries.length, entries });
});

/**
 * GET /api/logs/available-dates
 * Returns list of dates for which NDJSON log files exist.
 */
const getAvailableDates = asyncHandler(async (req, res) => {
    try {
        const files = fs.readdirSync(LOG_DIR)
            .filter(f => f.endsWith('.ndjson'))
            .map(f => f.replace('.ndjson', ''))
            .sort()
            .reverse();
        res.json({ dates: files });
    } catch {
        res.json({ dates: [] });
    }
});

module.exports = { getLogs, getLogStats, getLogsByDate, getAvailableDates };
