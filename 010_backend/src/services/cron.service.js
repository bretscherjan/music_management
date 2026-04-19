const cron = require('node-cron');
const notificationService = require('./notification.service');
const prisma = require('../utils/prisma');

// ── Traffic Analytics: aggregate raw PageViews into daily summaries ──────────
async function aggregateTrafficData() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2); // Keep last 2 days raw for real-time queries
    cutoff.setHours(0, 0, 0, 0);

    // Find distinct dates that need aggregation
    const rawRows = await prisma.pageView.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true, path: true, country: true, deviceType: true, visitorHash: true, createdAt: true },
    });

    if (rawRows.length === 0) return;

    // Group by date + path
    const grouped = new Map();
    for (const row of rawRows) {
        const date = row.createdAt.toISOString().slice(0, 10);
        const key = `${date}||${row.path}`;
        if (!grouped.has(key)) {
            grouped.set(key, { date, path: row.path, hashes: new Set(), devices: {}, countries: {} });
        }
        const g = grouped.get(key);
        g.hashes.add(row.visitorHash);
        g.devices[row.deviceType] = (g.devices[row.deviceType] || 0) + 1;
        if (row.country) g.countries[row.country] = (g.countries[row.country] || 0) + 1;
    }

    // Upsert daily summaries
    for (const [, g] of grouped) {
        const dateObj = new Date(g.date + 'T00:00:00.000Z');
        await prisma.trafficDailySummary.upsert({
            where: { date_path: { date: dateObj, path: g.path } },
            create: {
                date: dateObj,
                path: g.path,
                views: rawRows.filter(r => r.path === g.path && r.createdAt.toISOString().slice(0, 10) === g.date).length,
                uniqueVisitors: g.hashes.size,
                deviceBreakdown: g.devices,
                countryBreakdown: g.countries,
            },
            update: {
                views: { increment: rawRows.filter(r => r.path === g.path && r.createdAt.toISOString().slice(0, 10) === g.date).length },
                uniqueVisitors: g.hashes.size,
                deviceBreakdown: g.devices,
                countryBreakdown: g.countries,
            },
        }).catch(err => console.warn('[Cron] Summary upsert error:', err.message));
    }

    // Delete aggregated raw rows
    const idsToDelete = rawRows.map(r => r.id);
    const deleted = await prisma.pageView.deleteMany({ where: { id: { in: idsToDelete } } });
    console.log(`🧹 [Cron] Traffic: aggregated ${rawRows.length} rows into summaries, deleted ${deleted.count} raw entries.`);
}

const initializeCronJobs = () => {
    console.log('⏳ Initializing Cron Jobs...');

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

    // Aggregate traffic data daily at 03:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log(`📊 [Cron] Running traffic data aggregation at ${new Date().toISOString()}`);
        try {
            await aggregateTrafficData();
        } catch (error) {
            console.error('❌ [Cron] Error aggregating traffic data:', error);
        }
    });

    console.log('✅ Cron Jobs initialized: Daily AuditLog cleanup (02:00), Traffic aggregation (03:00)');
};

module.exports = {
    initializeCronJobs
};
