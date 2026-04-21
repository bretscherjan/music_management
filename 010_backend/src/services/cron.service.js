const cron = require('node-cron');
const prisma = require('../utils/prisma');

const initializeCronJobs = () => {
    console.log('⏳ Initializing Cron Jobs...');

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
