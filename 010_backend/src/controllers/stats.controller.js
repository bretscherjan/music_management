const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Get attendance summary statistics
 * GET /api/stats/attendance-summary
 */
const getAttendanceSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate, registerId } = req.query;

    // Default to current year if not specified
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31);

    // Filter events in range
    const dateFilter = {
        date: {
            gte: start,
            lte: end
        },
        // We only care about events that have happened or are marked as such? 
        // Generally stats are for past events.
    };

    // Filter by register if provided (though usually we want all stats)
    // Actually, register filter might be applied on Users, not Events. 
    // But if we want stats FOR a register, we filter users.

    // 1. Get all Relevant Events
    // We only want events that "count" for attendance (e.g. rehearsals, performances).
    // Maybe exclude "other" or specific types? For now, include all or filter by category if needed.
    const events = await prisma.event.findMany({
        where: dateFilter,
        select: { id: true, date: true, title: true, category: true }
    });

    const eventIds = events.map(e => e.id);

    if (eventIds.length === 0) {
        return res.json({
            message: 'Keine Events im Zeitraum gefunden',
            stats: [],
            pieChartData: []
        });
    }

    // 2. Get Verified Attendances for these events
    const verifiedAttendances = await prisma.verifiedAttendance.findMany({
        where: {
            eventId: { in: eventIds }
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    register: { select: { id: true, name: true } }
                }
            }
        }
    });

    // 3. Calculate Stats per User
    // We also need to know the potential *total* events for each user.
    // Simplifying assumption: Every user *should* have attended every event unless excluded?
    // Or we just count the verified entries.
    // If a user has NO verified entry for an event, does it count as Absent or "Not Relevant"?
    // "Analyse: Das Dashboard greift nun nur noch auf diese verifizierten Daten zu"
    // So we treat VerifiedAttendance as the source. If no record, maybe they weren't member yet?
    // Better: Count how many VerifiedAttendances exist for the user.

    // Group by User
    const userStatsMap = new Map();

    for (const record of verifiedAttendances) {
        const userId = record.userId;
        const status = record.status; // PRESENT, EXCUSED, UNEXCUSEDUser

        if (!userStatsMap.has(userId)) {
            userStatsMap.set(userId, {
                user: record.user,
                present: 0,
                excused: 0,
                unexcused: 0,
                total: 0
            });
        }

        const stats = userStatsMap.get(userId);
        stats.total++;
        if (status === 'PRESENT') stats.present++;
        if (status === 'EXCUSED') stats.excused++;
        if (status === 'UNEXCUSED') stats.unexcused++;
    }

    // Convert map to array and calculate percentages
    let userStats = Array.from(userStatsMap.values()).map(stat => {
        const presentRate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0;
        return {
            ...stat,
            presentRate: parseFloat(presentRate.toFixed(1))
        };
    });

    // Filter by register if requested
    if (registerId) {
        userStats = userStats.filter(s => s.user.register?.id === parseInt(registerId));
    }

    // Sort by Best Attendance
    userStats.sort((a, b) => b.presentRate - a.presentRate);

    // 4. Calculate Aggregate Data (Pie Chart)
    const totalPresent = userStats.reduce((sum, s) => sum + s.present, 0);
    const totalExcused = userStats.reduce((sum, s) => sum + s.excused, 0);
    const totalUnexcused = userStats.reduce((sum, s) => sum + s.unexcused, 0);

    const pieChartData = [
        { name: 'Anwesend', value: totalPresent },
        { name: 'Entschuldigt', value: totalExcused },
        { name: 'Unentschuldigt', value: totalUnexcused }
    ];

    // 5. Calculate Register Stats (Average per register)
    const registerStatsMap = new Map();
    for (const stat of userStats) {
        const regName = stat.user.register?.name || 'Ohne Register';
        if (!registerStatsMap.has(regName)) {
            registerStatsMap.set(regName, { name: regName, totalPresentRate: 0, count: 0 });
        }
        const regStat = registerStatsMap.get(regName);
        regStat.totalPresentRate += stat.presentRate;
        regStat.count++;
    }

    const registerStats = Array.from(registerStatsMap.values()).map(r => ({
        name: r.name,
        averageAttendance: parseFloat((r.totalPresentRate / r.count).toFixed(1))
    })).sort((a, b) => b.averageAttendance - a.averageAttendance);

    res.json({
        period: { start, end },
        userStats, // For Top 10 Table
        pieChartData,
        registerStats // For Register Comparison if needed
    });
});

module.exports = {
    getAttendanceSummary
};
