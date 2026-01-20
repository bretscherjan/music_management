const cron = require('node-cron');
const notificationService = require('./notification.service');

const initializeCronJobs = () => {
    console.log('⏳ Initializing Cron Jobs...');

    // Run reminder check every hour at minute 0
    // Format: second(optional) minute hour day-of-month month day-of-week
    cron.schedule('0 * * * *', async () => {
        console.log(`⏰ [Cron] Running hourly reminder check at ${new Date().toISOString()}`);
        try {
            await notificationService.sendEventReminders();
        } catch (error) {
            console.error('❌ [Cron] Error running reminder check:', error);
        }
    });

    console.log('✅ Cron Jobs initialized: Hourly Event Reminders (Minute 0)');
};

module.exports = {
    initializeCronJobs
};
