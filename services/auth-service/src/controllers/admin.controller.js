const { asyncHandler } = require('../../../../packages/shared/src/middlewares/errorHandler.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get system status and reminder stats
 * GET /api/admin/reminders
 */
const getReminderStats = asyncHandler(async (req, res) => {
    // Return dummy data since reminders are now handled by event-service
    res.json({ upcoming: [] });
});

module.exports = {
    getReminderStats
};

