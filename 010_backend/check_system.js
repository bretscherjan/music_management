require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
});

const reminderQueue = new Queue('event-reminders', { connection });

async function check() {
    console.log('--- SYSTEM CHECK ---');
    console.log(`Redis Host: ${process.env.REDIS_HOST || 'localhost'}`);

    console.log('1. Checking Redis Connection...');
    try {
        await connection.ping();
        console.log('✅ Redis is UP (PONG)');
    } catch (e) {
        console.error('❌ Redis Connection FAILED:', e.message);
        process.exit(1);
    }

    console.log('2. Checking Reminder Queue...');
    try {
        const counts = await reminderQueue.getJobCounts();
        console.log('Queue Counts:', counts);

        const delayed = await reminderQueue.getJobs(['delayed']);
        console.log(`Delayed Jobs (Planned Reminders): ${delayed.length}`);

        if (delayed.length > 0) {
            delayed.forEach(j => {
                const runAt = new Date(Number(j.timestamp) + Number(j.delay));
                console.log(`- Job ${j.id}: Event ${j.data.eventId} User ${j.data.userId} -> Runs at ${runAt.toISOString()} (Channels: ${JSON.stringify(j.data.channels)})`);
            });
        }

        const failed = await reminderQueue.getJobs(['failed']);
        if (failed.length > 0) {
            console.log(`FAILED Jobs: ${failed.length}`);
            failed.slice(0, 5).forEach(j => {
                console.log(`- Failed Job ${j.id}: ${j.failedReason}`);
            });
        }

    } catch (e) {
        console.error('❌ Queue Check FAILED:', e.message);
    }

    console.log('3. Checking Users with Reminders...');
    try {
        const users = await prisma.user.findMany({
            where: { status: 'active' },
            include: { notificationSettings: true }
        });

        let activeRemindersCount = 0;
        const usersWithSettings = [];

        users.forEach(u => {
            const s = u.notificationSettings?.reminderSettings;
            if (s) {
                // Check if any category is enabled
                const hasEnabled = Object.values(s).some(cat => cat && cat.enabled);
                if (hasEnabled) {
                    activeRemindersCount++;
                    usersWithSettings.push({ email: u.email, settings: s });
                }
            }
        });
        console.log(`Found ${users.length} active users. ${activeRemindersCount} have ENABLED reminder settings.`);

        if (usersWithSettings.length > 0) {
            console.log('Sample User Settings:', JSON.stringify(usersWithSettings[0], null, 2));
        }

    } catch (e) {
        console.error('❌ DB Check FAILED:', e.message);
    }

    console.log('--- END CHECK ---');
    process.exit(0);
}

check();
