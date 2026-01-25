// verify_scheduler.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { scheduleEventReminders, reminderQueue, cancelEventReminders } = require('./src/services/reminder.queue.service');

async function test() {
    console.log('--- STARTING SCHEDULER TEST ---');
    try {
        // 1. Setup Data
        // Find or create a test user with specific settings
        let user = await prisma.user.findFirst({ where: { email: 'scheduler_test@example.com' } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: 'scheduler_test@example.com',
                    password: 'hash',
                    firstName: 'Scheduler',
                    lastName: 'Test',
                    status: 'active',
                    notificationSettings: {
                        create: {
                            notifyEventReminder: true,
                            reminderTimeBeforeHours: 2 // 2 hours before
                        }
                    }
                }
            });
        }
        console.log(`Test User ID: ${user.id}`);

        // Create a dummy event tomorrow at 20:00 Zurich Time
        // stored as ISO string in DB
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString(); // UTC

        const event = await prisma.event.create({
            data: {
                title: 'Scheduler Test Event',
                description: 'Testing personalized reminders',
                date: tomorrow,
                startTime: '20:00',
                endTime: '22:00',
                visibility: 'all',
            }
        });
        console.log(`Test Event ID: ${event.id}`);

        // 2. Run Schedule
        console.log('Running scheduleEventReminders...');
        await scheduleEventReminders(event);

        // 3. Verify Queue
        console.log('Inspecting Queue...');
        const jobs = await reminderQueue.getJobs(['delayed']);
        const ourJob = jobs.find(j => j.id === `reminder-${event.id}-${user.id}`);

        if (ourJob) {
            console.log('✅ SUCCESS: Job found!');
            console.log(`   Job ID: ${ourJob.id}`);
            console.log(`   Delay: ${ourJob.delay / 1000 / 60 / 60} hours (approx)`);
            console.log(`   Data:`, ourJob.data);
        } else {
            console.error('❌ FAILURE: Job NOT found!');
        }

        // Cleanup
        await cancelEventReminders(event.id);
        await prisma.event.delete({ where: { id: event.id } });
        // Don't delete user to avoid constraints or complex cleanup, just leave it.

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await prisma.$disconnect();
        // Close redis connection to exit script
        process.exit();
    }
}

test();
