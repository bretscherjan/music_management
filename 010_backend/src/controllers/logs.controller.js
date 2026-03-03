const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const logger = require('../utils/logger');

/**
 * GET /api/logs
 * Returns the most recent log entries from the in-memory buffer.
 * Query params: limit (default 50), level (INFO|WARN|ERROR)
 */
const getLogs = asyncHandler(async (req, res) => {
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const level = req.query.level?.toUpperCase() || null;
    const entries = logger.getBuffer(limit, level);
    res.json({ count: entries.length, entries });
});

/**
 * GET /api/logs/stats
 * Returns counts per level from the buffer.
 */
const getLogStats = asyncHandler(async (req, res) => {
    res.json(logger.getStats());
});

module.exports = { getLogs, getLogStats };
