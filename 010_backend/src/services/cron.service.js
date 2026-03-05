const cron = require('node-cron');
const notificationService = require('./notification.service');
const prisma = require('../utils/prisma');

const initializeCronJobs = () => {
    console.log('⏳ Initializing Cron Jobs...');

    // Run reminder check every hour at minute 0
    // Format: second(optional) minute hour day-of-month month day-of-week
    // cron.schedule('0 * * * *', async () => {
    //     console.log(`⏰ [Cron] Running hourly reminder check at ${new Date().toISOString()}`);
    //     try {
    //         await notificationService.sendEventReminders();
    //     } catch (error) {
    //         console.error('❌ [Cron] Error running reminder check:', error);
    //     }
    // });
    console.log('ℹ️ Legacy Cron Job (Hourly Event Reminders) disabled in favor of Queue system.');

    // Cleanup old AuditLogs daily at 02:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log(`🧹 [Cron] Running daily AuditLog cleanup at ${new Date().toISOString()}`);
        try {
            const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
            const result = await prisma.auditLog.deleteMany({
                where: { createdAt: { lt: cutoff } }
            });
            if (result.count > 0) {
                console.log(`🧹 [Cron] Cleared ${result.count} old AuditLog entries.`);
            }
        } catch (error) {
            console.error('❌ [Cron] Error clearing old AuditLogs:', error);
        }
    });

    console.log('✅ Cron Jobs initialized: Daily AuditLog cleanup (02:00)');
};

module.exports = {
    initializeCronJobs
};
