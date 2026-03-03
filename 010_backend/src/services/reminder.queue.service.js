const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const notificationService = require('./notification.service');
const { DateTime } = require('luxon');
const logger = require('../utils/logger');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Connection to Redis
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
});

const REMINDER_QUEUE_NAME = 'event-reminders';

// Initialize Queue
const reminderQueue = new Queue(REMINDER_QUEUE_NAME, { connection });

// Define Worker
let worker;

const initializeReminderQueue = () => {
    if (worker) return; // Already initialized

    console.log(`🚀 Initializing Reminder Queue: ${REMINDER_QUEUE_NAME}`);

    worker = new Worker(REMINDER_QUEUE_NAME, async (job) => {
        console.log(`Processing reminder job ${job.id} for event ${job.data.eventId} user ${job.data.userId} channels:`, job.data.channels, `minutes:`, job.data.minutesBefore);
        try {
            const { eventId, userId, channels, minutesBefore } = job.data;
            await notificationService.sendScheduledReminder(eventId, userId, channels, minutesBefore);
        } catch (error) {
            console.error(`Failed to process reminder job ${job.id}:`, error);
            throw error;
        }
    }, { connection });

    worker.on('completed', job => {
        console.log(`Reminder job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Reminder job ${job.id} has failed with ${err.message}`);
        logger.error({ source: 'BullMQ', action: 'REMINDER_JOB_FAILED', info: `Job ${job.id} – ${err.message}` });
    });
};

/**
 * Schedule personalized reminders for an event
 * @param {Object} event Full event object
 */
const scheduleEventReminders = async (event) => {
    // 1. Fetch all active users with their notification settings and attendance/register info
    const users = await prisma.user.findMany({
        where: {
            status: 'active',
            notificationSettings: {
                reminderSettings: {
                    not: null // Only users who have configured reminders
                }
            }
        },
        include: {
            notificationSettings: true,
            attendances: {
                where: { eventId: event.id }
            },
            register: true
        }
    });

    const eventDateStr = event.date.toISOString().split('T')[0];
    const eventDateTime = DateTime.fromISO(`${eventDateStr}T${event.startTime}`, { zone: 'Europe/Zurich' });
    const eventTimestamp = eventDateTime.toMillis();
    const now = Date.now();

    let scheduledCount = 0;

    // Check if event has target registers restrictions
    const targetRegisterIds = event.targetRegisters?.map(r => r.id) || [];

    for (const user of users) {
        // --- 1. Visibility Check ---
        // If event is limited to registers, user must be in one
        if (targetRegisterIds.length > 0) {
            if (!user.registerId || !targetRegisterIds.includes(user.registerId)) {
                continue; // Skip user - not invited
            }
        }

        // --- 2. Admin Check ---
        if (event.visibility === 'admin' && user.role !== 'admin') {
            continue; // Skip user - admin only
        }

        // --- 3. Parse Reminder Settings ---
        const settings = user.notificationSettings?.reminderSettings;
        if (!settings) continue;

        // Get category-specific settings (fallback to 'other' or empty)
        const categorySettings = settings[event.category] || settings['other'];
        if (!categorySettings || !categorySettings.enabled) continue;

        // --- 4. Attendance Check ---
        if (categorySettings.onlyIfAttending) {
            // Check if user has explicit 'yes' attendance
            const attendance = user.attendances[0]; // We filtered by eventId in include
            if (!attendance || attendance.status !== 'yes') {
                continue; // Skip - user wants reminders only if attending
            }
        }

        // --- 5. Schedule Jobs ---
        const minutesList = categorySettings.minutesBefore || [];
        for (const minutesBefore of minutesList) {
            // Calculate delay
            const triggerTime = eventTimestamp - (minutesBefore * 60 * 1000);
            const delayInMs = triggerTime - now;

            if (delayInMs > 0) {
                const jobId = `reminder-${event.id}-${user.id}-${minutesBefore}`;

                // Remove existing if any (to handle updates)
                const existingJob = await reminderQueue.getJob(jobId);
                if (existingJob) await existingJob.remove();

                await reminderQueue.add('send-reminder', {
                    eventId: event.id,
                    userId: user.id,
                    minutesBefore,
                    channels: {
                        email: categorySettings.emailEnabled,
                        push: categorySettings.pushEnabled
                    }
                }, {
                    delay: delayInMs,
                    jobId: jobId,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                    removeOnComplete: true
                });
                scheduledCount++;
            }
        }
    }
    console.log(`✅ Scheduled ${scheduledCount} personalized reminders for event ${event.id} (${event.title})`);
};

/**
 * Cancel all reminders for an event
 * @param {number} eventId 
 */
const cancelEventReminders = async (eventId) => {
    // We iterate active jobs/delayed jobs matching pattern.
    // Efficient way: Fetch active users again?
    // Actually, BullMQ doesn't support pattern delete easily.
    // Iterating all active users is safer than scanning redis keys manually.

    // Fetch users (id only)
    const users = await prisma.user.findMany({ select: { id: true } });

    // Common reminder intervals (to guess job IDs) - hard to guess custom intervals.
    // Better strategy: Clean ALL scheduled jobs for this event ID pattern?
    // Pattern: `reminder-{eventId}-{userId}-{minutes}`

    // We can use getJobs and filter
    const delayedJobs = await reminderQueue.getJobs(['delayed']);
    const jobsToRemove = delayedJobs.filter(job => job.data.eventId === eventId);

    await Promise.all(jobsToRemove.map(job => job.remove()));

    console.log(`Cancelled ${jobsToRemove.length} reminders for event ${eventId}`);
};

/**
 * Re-Schedule reminders for ALL future events (migrates/syncs old state)
 */
const syncReminders = async () => {
    console.log('🔄 Syncing Reminders (User-Based)...');
    try {
        const now = new Date();
        // Fetch all future events
        const futureEvents = await prisma.event.findMany({
            where: {
                date: { gte: now }
            },
            include: {
                targetRegisters: true
            }
        });

        console.log(`Found ${futureEvents.length} future events to check.`);
        let syncedCount = 0;

        for (const event of futureEvents) {
            await scheduleEventReminders(event);
            syncedCount++;
        }
        console.log(`✅ Synced reminders for ${syncedCount} events.`);

    } catch (error) {
        console.error('❌ Error syncing reminders:', error);
    }
};

/**
 * Get detailed status of the reminder queue
 * @returns {Promise<Object>}
 */
const getQueueStatus = async () => {
    try {
        const counts = await reminderQueue.getJobCounts('wait', 'active', 'delayed', 'failed', 'completed');
        const delayedJobs = await reminderQueue.getJobs(['delayed'], 0, 49, true);

        const scheduled = delayedJobs.map(job => {
            const runAt = new Date(job.timestamp + job.delay);
            return {
                id: job.id,
                eventId: job.data.eventId,
                userId: job.data.userId,
                intervalMinutes: job.data.minutesBefore,
                runAt: runAt.toISOString(),
                attempts: job.attemptsMade,
                failedReason: job.failedReason
            };
        });

        scheduled.sort((a, b) => new Date(a.runAt) - new Date(b.runAt));

        return {
            counts,
            upcoming: scheduled.slice(0, 10)
        };
    } catch (error) {
        console.error('Error fetching queue status:', error);
        return { error: error.message };
    }
};

module.exports = {
    initializeReminderQueue,
    scheduleEventReminders,
    cancelEventReminders,
    syncReminders,
    getQueueStatus,
    reminderQueue
};
