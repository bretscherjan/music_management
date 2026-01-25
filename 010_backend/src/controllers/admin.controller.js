const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const { getQueueStatus } = require('../services/reminder.queue.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get system status and reminder stats
 * GET /api/admin/reminders
 */
const getReminderStats = asyncHandler(async (req, res) => {
    // 1. Get Queue Status 
    const queueStatus = await getQueueStatus();

    // 2. Enrich upcoming jobs with Event Titles
    // The queue service returns: { eventId, runAt, ... }
    if (queueStatus.upcoming && queueStatus.upcoming.length > 0) {
        const eventIds = [...new Set(queueStatus.upcoming.map(job => job.eventId))];

        const events = await prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true }
        });

        const eventMap = new Map(events.map(e => [e.id, e.title]));

        queueStatus.upcoming = queueStatus.upcoming.map(job => ({
            ...job,
            eventTitle: eventMap.get(job.eventId) || 'Unbekanntes Event'
        }));
    }

    res.json(queueStatus);
});

module.exports = {
    getReminderStats
};
