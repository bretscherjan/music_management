const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const PdfPrinter = require('pdfmake/js/Printer').default;
const path = require('path');
const { FONTS, STYLES, DEFAULT_STYLE, TABLE_LAYOUT, parseOpts, buildTitleBlock, buildHeaderFooter } = require('../utils/pdfStyles');

const prisma = new PrismaClient();

/**
 * Get Repertoire Statistics
 * GET /api/stats/repertoire
 * Query: startDate, endDate, category, limit
 */
const getRepertoireStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, category, limit = 20 } = req.query;

    const whereClause = {
        event: {
            date: {
                lt: new Date() // Only past events
            }
        }
    };

    if (startDate) {
        whereClause.event.date.gte = new Date(startDate);
    }

    if (endDate) {
        whereClause.event.date.lte = new Date(endDate);
    }

    if (category) {
        whereClause.event.category = category;
    }

    // 1. Aggregation: Count usages per sheetMusicId
    // Note: We only want to count actual sheet music (type 'sheetMusic'), not pauses or custom items without sheetMusicId
    const usageStats = await prisma.eventSheetMusic.groupBy({
        by: ['sheetMusicId'],
        _count: {
            sheetMusicId: true
        },
        where: {
            ...whereClause,
            type: 'sheetMusic',
            sheetMusicId: { not: null }
        },
        orderBy: {
            _count: {
                sheetMusicId: 'desc'
            }
        },
        // Only take top N if limit is set? 
        // groupBy doesn't support 'take' directly in all prisma versions for aggregation result, 
        // but we can slice the result later. 
        // Actually, for "Long Tail" we need ALL stats, so maybe we shouldn't limit here unless explicitly requested for a chart.
    });

    // 2. Fetch Sheet Music Details for the aggregated IDs
    // We need to map the IDs back to titles/composers
    const sheetIds = usageStats.map(s => s.sheetMusicId);

    const sheetDetails = await prisma.sheetMusic.findMany({
        where: {
            id: { in: sheetIds }
        },
        select: {
            id: true,
            title: true,
            composer: true,
            genre: true
        }
    });

    const sheetMap = new Map(sheetDetails.map(s => [s.id, s]));

    // 3. Combine Data and Calculate Last Played
    // To get "Last Played", we need a separate query or a custom raw query.
    // GroupBy DOES support _max on relations in some db/prisma versions, but let's do it safely.
    // For each piece, we might want to know the last event date.
    // To avoid N+1, maybe we can fetch all EventSheetMusic entries and process in memory if dataset isn't huge?
    // Or we do a second aggregation for max date.

    const lastPlayedStats = await prisma.eventSheetMusic.groupBy({
        by: ['sheetMusicId'],
        _max: {
            eventId: true // This gives us max Event ID, which roughly correlates to date but not guaranteed if IDs aren't chronological.
            // Better: We can't easily get max *date* of the relation directly in simple groupBy in older prisma without raw query.
            // Alternative: Fetch the latest event for each sheet separately? Expensive.
            // Let's iterate and find unique sheet IDs?
        },
        where: {
            ...whereClause,
            type: 'sheetMusic',
            sheetMusicId: { not: null }
        }
    });

    // Actually, let's try to get "Last Played" by ensuring we fetch the latest event date.
    // We can do this efficiently by fetching all EventSheetMusic with Event Date selected, then reducing.
    // If dataset is expected to be < 10k rows, memory is fine.

    const allUsages = await prisma.eventSheetMusic.findMany({
        where: {
            ...whereClause,
            type: 'sheetMusic',
            sheetMusicId: { not: null }
        },
        select: {
            sheetMusicId: true,
            event: {
                select: {
                    date: true,
                    category: true
                }
            }
        }
    });

    // Process in memory
    const statsMap = new Map();

    allUsages.forEach(usage => {
        const sid = usage.sheetMusicId;
        if (!statsMap.has(sid)) {
            statsMap.set(sid, {
                sheetMusicId: sid,
                count: 0,
                lastPlayed: null,
                categoryCounts: {}
            });
        }

        const entry = statsMap.get(sid);
        entry.count++;

        const eventDate = new Date(usage.event.date);
        if (!entry.lastPlayed || eventDate > new Date(entry.lastPlayed)) {
            entry.lastPlayed = eventDate;
        }

        const cat = usage.event.category;
        entry.categoryCounts[cat] = (entry.categoryCounts[cat] || 0) + 1;
    });

    // Merge with details
    const result = [];

    // Also include "orphaned" pieces (0 plays) if we want "Long Tail"? 
    // The user requirement says "Long-Tail-Analyse... wie viele Stücke im Archiv verwaist sind".
    // So we should fetch ALL sheet music and match.

    const allSheets = await prisma.sheetMusic.findMany({
        select: { id: true, title: true, composer: true, genre: true }
    });

    const fullResult = allSheets.map(sheet => {
        const stats = statsMap.get(sheet.id) || {
            count: 0,
            lastPlayed: null,
            categoryCounts: {}
        };

        return {
            id: sheet.id,
            title: sheet.title,
            composer: sheet.composer,
            genre: sheet.genre,
            playCount: stats.count,
            lastPlayed: stats.lastPlayed,
            rehearsalCount: stats.categoryCounts['rehearsal'] || 0,
            performanceCount: stats.categoryCounts['performance'] || 0
        };
    });

    // Sort by play count desc
    fullResult.sort((a, b) => b.playCount - a.playCount);

    res.json(fullResult);
});


/**
 * Export Repertoire Stats as PDF
 * GET /api/stats/repertoire/export
 */
const exportRepertoirePdf = asyncHandler(async (req, res) => {
    const { startDate, endDate, category } = req.query;
    const opts = parseOpts(req.query);

    // Reuse logic (duplicated for now to keep clean independence, or extract to helper)
    // For PDF we might want the same data logic.
    // Ideally we extract the specific data fetching logic.
    // ... Copying logic for now ...

    const whereClause = {
        event: {
            date: {
                lt: new Date()
            }
        }
    };

    if (startDate) whereClause.event.date.gte = new Date(startDate);
    if (endDate) whereClause.event.date.lte = new Date(endDate);
    if (category) whereClause.event.category = category;

    const allUsages = await prisma.eventSheetMusic.findMany({
        where: {
            ...whereClause,
            type: 'sheetMusic',
            sheetMusicId: { not: null }
        },
        select: {
            sheetMusicId: true,
            event: { select: { date: true, category: true } }
        }
    });

    const statsMap = new Map();
    allUsages.forEach(usage => {
        const sid = usage.sheetMusicId;
        if (!statsMap.has(sid)) {
            statsMap.set(sid, { count: 0, lastPlayed: null, categoryCounts: {} });
        }
        const entry = statsMap.get(sid);
        entry.count++;
        const eventDate = new Date(usage.event.date);
        if (!entry.lastPlayed || eventDate > new Date(entry.lastPlayed)) entry.lastPlayed = eventDate;
        const cat = usage.event.category;
        entry.categoryCounts[cat] = (entry.categoryCounts[cat] || 0) + 1;
    });

    const allSheets = await prisma.sheetMusic.findMany({
        select: { id: true, title: true, composer: true, genre: true },
        orderBy: { title: 'asc' }
    });

    const data = allSheets.map(sheet => {
        const stats = statsMap.get(sheet.id) || { count: 0, lastPlayed: null, categoryCounts: {} };
        return {
            title: sheet.title,
            composer: sheet.composer,
            playCount: stats.count,
            lastPlayed: stats.lastPlayed,
            rehearsalCount: stats.categoryCounts['rehearsal'] || 0,
            performanceCount: stats.categoryCounts['performance'] || 0
        };
    }).sort((a, b) => b.playCount - a.playCount); // Sort by usage desc

    // Generate PDF
    const periodStr = `${startDate ? new Date(startDate).toLocaleDateString('de-CH') : 'Anfang'} - ${endDate ? new Date(endDate).toLocaleDateString('de-CH') : 'Heute'}`;
    const fonts = FONTS;

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
        pageOrientation: 'portrait',
        ...buildHeaderFooter('Repertoire Statistik', opts),
        content: [
            ...buildTitleBlock('Repertoire Statistik', `Zeitraum: ${periodStr}`, opts),
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                    body: [
                        [
                            { text: 'Titel / Komponist', style: 'tableHeader' },
                            { text: 'Total', style: 'tableHeader', alignment: 'center' },
                            { text: 'Proben', style: 'tableHeader', alignment: 'center' },
                            { text: 'Auftritte', style: 'tableHeader', alignment: 'center' },
                            { text: 'Zuletzt', style: 'tableHeader', alignment: 'right' }
                        ],
                        ...data.map(item => [
                            { text: `${item.title}\n${item.composer || ''}`, style: 'cellText' },
                            { text: item.playCount.toString(), alignment: 'center', bold: true },
                            { text: item.rehearsalCount.toString(), alignment: 'center' },
                            { text: item.performanceCount.toString(), alignment: 'center' },
                            { text: item.lastPlayed ? new Date(item.lastPlayed).toLocaleDateString('de-CH') : '-', alignment: 'right' }
                        ])
                    ]
                },
                layout: 'lightHorizontalLines'
            }
        ],
        styles: STYLES
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=repertoire-stats.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end();
});

/**
 * Get Attendance Statistics
 * GET /api/stats/attendance
 * Query: startDate, endDate
 */
const getAttendanceStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const whereClause = {};

    if (startDate || endDate) {
        whereClause.event = {};
        if (startDate) whereClause.event.date = { ...whereClause.event.date, gte: new Date(startDate) };
        if (endDate) whereClause.event.date = { ...whereClause.event.date, lte: new Date(endDate) };
    }

    // 1. Overall Distribution (Present, Excused, Unexcused)
    const distributionRaw = await prisma.verifiedAttendance.groupBy({
        by: ['status'],
        _count: {
            status: true
        },
        where: whereClause
    });

    const distribution = distributionRaw.map(d => ({
        name: d.status,
        value: d._count.status
    }));

    // 2. Attendees Detailed Stats
    // Fetch all verified attendances in range
    const allAttendances = await prisma.verifiedAttendance.findMany({
        where: whereClause,
        select: {
            userId: true,
            status: true
        }
    });

    // Fetch User Details including Register
    // We fetch all active users to ensure we have a base, but strictly we only have stats for those with attendance records.
    // Use userIds from attendance to filter, but maybe we want "0" for others? 
    // Let's stick to users who have at least one record to avoid cluttering with non-active/legacy users, 
    // unless we want to show '0%'. For now, strict to records.
    const userIds = [...new Set(allAttendances.map(a => a.userId))];

    // Fetch users with their register
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            register: {
                select: { name: true }
            }
        },
        orderBy: { lastName: 'asc' } // Default sort by name
    });

    // Aggregation Map
    const statsMap = new Map();
    // Initialize map with users
    users.forEach(u => {
        statsMap.set(u.id, {
            id: u.id,
            name: `${u.lastName} ${u.firstName}`, // "Nachname Vorname" typical for lists
            firstName: u.firstName,
            lastName: u.lastName,
            register: u.register ? u.register.name : '-',
            profilePicture: u.profilePicture,
            present: 0,
            excused: 0,
            unexcused: 0,
            total: 0
        });
    });

    allAttendances.forEach(att => {
        const entry = statsMap.get(att.userId);
        if (entry) {
            entry.total++;
            if (att.status === 'PRESENT') entry.present++;
            else if (att.status === 'EXCUSED') entry.excused++;
            else if (att.status === 'UNEXCUSED') entry.unexcused++;
        }
    });

    const attendees = Array.from(statsMap.values()).map(s => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
    }));

    // Sort by Rate desc, then Name (or just Name as requested? Screenshot shows sorted by Rate? No, screenshot looks random/mixed. Let's sort by Name default or Rate.)
    // Screenshot: "Meier" then "Bretscher". Seems sorted by Name.
    // Let's sort by Name (LastName) default.
    attendees.sort((a, b) => a.lastName.localeCompare(b.lastName));

    // Top Attendees (Derived from full list)
    const topAttendees = [...attendees]
        .sort((a, b) => b.present - a.present)
        .slice(0, 10)
        .map(a => ({
            id: a.id,
            name: `${a.firstName} ${a.lastName}`,
            count: a.present,
            profilePicture: a.profilePicture
        }));

    res.json({
        distribution,
        attendees, // Full detailed list
        topAttendees // For the chart
    });
});

/**
 * Export Attendance Stats as PDF
 * GET /api/stats/attendance/export
 */
const exportAttendancePdf = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const opts = parseOpts(req.query);

    const whereClause = {};
    if (startDate || endDate) {
        whereClause.event = {};
        if (startDate) whereClause.event.date = { ...whereClause.event.date, gte: new Date(startDate) };
        if (endDate) whereClause.event.date = { ...whereClause.event.date, lte: new Date(endDate) };
    }

    const allAttendances = await prisma.verifiedAttendance.findMany({
        where: whereClause,
        select: { userId: true, status: true }
    });

    const userIds = [...new Set(allAttendances.map(a => a.userId))];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            register: { select: { name: true } }
        },
        orderBy: { lastName: 'asc' }
    });

    const statsMap = new Map();
    users.forEach(u => {
        statsMap.set(u.id, {
            name: `${u.lastName} ${u.firstName}`,
            register: u.register ? u.register.name : '', // Empty string if null for clean layout
            present: 0,
            excused: 0,
            unexcused: 0,
            total: 0
        });
    });

    allAttendances.forEach(att => {
        const entry = statsMap.get(att.userId);
        if (entry) {
            entry.total++;
            if (att.status === 'PRESENT') entry.present++;
            else if (att.status === 'EXCUSED') entry.excused++;
            else if (att.status === 'UNEXCUSED') entry.unexcused++;
        }
    });

    const data = Array.from(statsMap.values()).map(s => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
    }));

    // Data sorted by Name
    data.sort((a, b) => a.name.localeCompare(b.name));

    const fonts = FONTS;

    const printer = new PdfPrinter(fonts);
    const today = new Date().toLocaleDateString('de-CH');
    const periodStr = `${startDate ? new Date(startDate).toLocaleDateString('de-CH') : 'Anfang'} - ${endDate ? new Date(endDate).toLocaleDateString('de-CH') : 'Heute'}`;

    // Charts Data Preparation

    // 1. Distribution Data
    let totalPresent = 0;
    let totalExcused = 0;
    let totalUnexcused = 0;
    let totalAll = 0;

    allAttendances.forEach(att => {
        totalAll++;
        if (att.status === 'PRESENT') totalPresent++;
        else if (att.status === 'EXCUSED') totalExcused++;
        else if (att.status === 'UNEXCUSED') totalUnexcused++;
    });

    const percentPresent = totalAll > 0 ? (totalPresent / totalAll) * 100 : 0;
    const percentExcused = totalAll > 0 ? (totalExcused / totalAll) * 100 : 0;
    const percentUnexcused = totalAll > 0 ? (totalUnexcused / totalAll) * 100 : 0;

    // 2. Top 10 Attendees
    // We already have 'data' sorted by Name. Let's create a sorted copy for the chart.
    const top10 = [...data]
        .sort((a, b) => b.present - a.present)
        .slice(0, 10);

    const maxAttendance = top10.length > 0 ? top10[0].present : 1;

    // Helper to generate bar chart row
    const createBarRow = (name, value, maxValue, color) => {
        const barWidth = (value / maxValue) * 250; // Max width ~250pt
        return [
            { text: name, style: 'chartLabel', width: 120 },
            {
                canvas: [{ type: 'rect', x: 0, y: 0, w: barWidth, h: 10, color: color }],
                alignment: 'left',
                margin: [0, 3, 0, 0]
            },
            { text: value.toString(), style: 'chartValue', width: 30, alignment: 'right' }
        ];
    };

    const docDefinition = {
        pageOrientation: 'portrait',
        ...buildHeaderFooter('Anwesenheitsstatistik', opts),
        content: [
            // Title Section
            ...buildTitleBlock('Anwesenheitsstatistik', `Zeitraum: ${periodStr}`, opts),

            // CHARTS SECTION

            // Distribution Chart (Stacked Bar)
            { text: 'Gesamtverteilung', style: 'sectionHeader', margin: [0, 10, 0, 5] },
            {
                table: {
                    widths: [`${percentPresent}%`, `${percentExcused}%`, `${percentUnexcused}%`],
                    body: [
                        [
                            {
                                text: `${Math.round(percentPresent)}%`,
                                fillColor: '#10b981', color: 'white', alignment: 'center', fontSize: 10, bold: true, border: [false, false, false, false]
                            },
                            {
                                text: `${Math.round(percentExcused)}%`,
                                fillColor: '#f59e0b', color: 'white', alignment: 'center', fontSize: 10, bold: true, border: [false, false, false, false]
                            },
                            {
                                text: `${Math.round(percentUnexcused)}%`,
                                fillColor: '#ef4444', color: 'white', alignment: 'center', fontSize: 10, bold: true, border: [false, false, false, false]
                            }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 5]
            },
            // Legend
            {
                columns: [
                    { width: '*', text: '' },
                    { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 3, w: 10, h: 10, color: '#10b981' }] },
                    { width: 'auto', text: ` Anwesend (${totalPresent})`, fontSize: 10, margin: [5, 0, 15, 0] },
                    { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 3, w: 10, h: 10, color: '#f59e0b' }] },
                    { width: 'auto', text: ` Entschuldigt (${totalExcused})`, fontSize: 10, margin: [5, 0, 15, 0] },
                    { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 3, w: 10, h: 10, color: '#ef4444' }] },
                    { width: 'auto', text: ` Unentschuldigt (${totalUnexcused})`, fontSize: 10, margin: [5, 0, 0, 0] },
                    { width: '*', text: '' }
                ],
                margin: [0, 0, 0, 25]
            },

            // Top 10 Chart
            { text: 'Top 10 Anwesende', style: 'sectionHeader', margin: [0, 0, 0, 10] },
            {
                table: {
                    widths: [130, '*', 30],
                    body: top10.map(item => createBarRow(item.name, item.present, maxAttendance, '#10b981'))
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 30]
            },

            { text: 'Detailliste', style: 'sectionHeader', margin: [0, 0, 0, 10], pageBreak: 'before' },

            // Table
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], // Let simpler widths
                    body: [
                        [
                            { text: 'Name', style: 'tableHeader' },
                            { text: 'Register', style: 'tableHeader' },
                            { text: 'Rate', style: 'tableHeader' },
                            { text: 'Anwesend', style: 'tableHeader', alignment: 'center' },
                            { text: 'Entschuldigt', style: 'tableHeader', alignment: 'center' },
                            { text: 'Unentschuldigt', style: 'tableHeader', alignment: 'center' },
                            { text: 'Total', style: 'tableHeader', alignment: 'center' }
                        ],
                        ...data.map((item, index) => {
                            const fillColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'; // Alternating row colors
                            return [
                                { text: item.name, style: 'cellText', fillColor },
                                { text: item.register, style: 'cellText', fillColor },
                                { text: `${item.rate}%`, style: 'cellText', fillColor },
                                { text: item.present.toString(), alignment: 'center', style: 'cellText', fillColor },
                                { text: item.excused.toString(), alignment: 'center', style: 'cellText', fillColor },
                                { text: item.unexcused.toString(), alignment: 'center', style: 'cellText', fillColor },
                                { text: item.total.toString(), alignment: 'center', style: 'cellText', fillColor, bold: true }
                            ];
                        })
                    ]
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 0 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return 0;
                    },
                    hLineColor: function (i, node) {
                        return '#eaeaea';
                    },
                    paddingLeft: function (i, node) { return 4; },
                    paddingRight: function (i, node) { return 4; },
                    paddingTop: function (i, node) { return 4; },
                    paddingBottom: function (i, node) { return 4; },
                    fillColor: function (rowIndex, node, columnIndex) {
                        return null; // Handle manually in cells
                    }
                }
            }
        ],
        styles: STYLES
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-stats.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end();
});

module.exports = {
    getRepertoireStats,
    exportRepertoirePdf,
    getAttendanceStats,
    exportAttendancePdf
};
