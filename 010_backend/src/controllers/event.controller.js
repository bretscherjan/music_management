const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const { expandRecurringEvents, addExcludedDate } = require('../services/recurrence.service');
const { sendBulkEventReminders } = require('../services/email.service');
const notificationService = require('../services/notification.service');

const prisma = new PrismaClient();

/**
 * Get all events with optional recurring event expansion
 * GET /events
 */
const getAllEvents = asyncHandler(async (req, res) => {
    const { startDate, endDate, category, expand } = req.query;
    const user = req.user;

    // Build where clause based on visibility
    const whereClause = {};

    // Filter by category if provided
    if (category) {
        whereClause.category = category;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
            whereClause.date.gte = new Date(startDate);
        }
        if (endDate) {
            whereClause.date.lte = new Date(endDate);
        }
    }

    // Visibility filter based on user role and register
    if (user) {
        if (user.role !== 'admin') {
            // Members can see 'all' events and events for their register
            whereClause.OR = [
                { visibility: 'all' },
                {
                    visibility: 'register', AND: user.registerId ? {
                        // Check if event is visible to user's register (future enhancement)
                    } : {}
                },
            ];
            // Simplify: members see 'all' visibility events
            delete whereClause.OR;
            whereClause.visibility = { in: ['all'] };
        }
        // Admins see everything
    } else {
        // Unauthenticated users only see public events
        whereClause.visibility = 'all';
    }

    // Get count of active members for calculating 'open' status
    const activeMembersCount = await prisma.user.count({
        where: { status: 'active' }
    });


    const events = await prisma.event.findMany({
        where: whereClause,
        include: {
            _count: {
                select: { attendances: true },
            },
            // Include attendances to calculate summary
            attendances: {
                include: {
                    user: {
                        select: { status: true }
                    }
                }
            },
            // Only include user's specific attendance if authenticated (for My Attendance)
            ...(user ? {
                // We can't easily include the SAME relation twice with different args in Prisma 
                // straightforwardly in a way that maps nice to the same field name.
                // But we fetched ALL attendances above. We can extract the user's attendance in memory.
            } : {}),
        },
        orderBy: { date: 'asc' },
    });

    // Expand recurring events if requested
    let result = events;
    if (expand === 'true' && startDate && endDate) {
        result = expandRecurringEvents(
            events,
            new Date(startDate),
            new Date(endDate)
        );
    }

    // Process events to add summary and userStatus
    const processedEvents = result.map(event => {
        // Filter attendances for active users only
        const activeAttendances = event.attendances.filter(a => a.user.status === 'active');

        const yes = activeAttendances.filter(a => a.status === 'yes').length;
        const no = activeAttendances.filter(a => a.status === 'no').length;
        const maybe = activeAttendances.filter(a => a.status === 'maybe').length;
        // Open = Total Active - (Yes + No + Maybe)
        // Note: This matches existing logic where 'pending' means no record or null status.
        // Prisma upsert ensures one record per user. If record missing, it's pending.
        const respondedCount = yes + no + maybe;
        const pending = Math.max(0, activeMembersCount - respondedCount);

        // Find user's attendance
        const userAttendance = user ? event.attendances.find(a => a.userId === user.id) : null;

        const summary = {
            yes,
            no,
            maybe,
            pending,
            total: activeMembersCount
        };
        // console.log(`DEBUG: Event ${event.id} summary:`, summary);

        return {
            ...event,
            attendanceSummary: summary,
            attendances: userAttendance ? [userAttendance] : [], // Restore expected behavior
        };
    });

    res.json({
        events: processedEvents,
        count: processedEvents.length,
    });
});

/**
 * Get event by ID
 * GET /events/:id
 */
const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
        include: {
            attendances: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            register: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
            },
            files: user?.role === 'admin' ? true : {
                where: {
                    OR: [
                        { visibility: 'all' },
                        ...(user?.registerId ? [{
                            visibility: 'register',
                            targetRegisterId: user.registerId
                        }] : []),
                    ],
                },
            },
            sheetMusic: {
                include: {
                    sheetMusic: true,
                },
                orderBy: { position: 'asc' },
            },
        },
    });

    if (!event) {
        throw new AppError('Event nicht gefunden', 404);
    }

    if (event.visibility === 'admin' && user?.role !== 'admin') {
        throw new AppError('Keine Berechtigung für diesen Event', 403);
    }

    // Map sheetMusic relation to setlist property for frontend consistency
    const eventData = {
        ...event,
        setlist: event.sheetMusic,
    };
    delete eventData.sheetMusic;

    res.json({ event: eventData });
});

/**
 * Create new event (or multiple events for recurring)
 * POST /events
 */
const createEvent = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        location,
        category,
        visibility,
        date,
        startTime,
        endTime,
        isRecurring,
        recurrenceRule,
        responseDeadlineHours = 48, // Default 48 hours = 2 days before
        defaultAttendanceStatus,
        setlistEnabled = false,
    } = req.body;

    const eventDate = new Date(date);

    // If recurring, generate all individual events
    if (isRecurring && recurrenceRule) {
        const { getEventOccurrences } = require('../services/recurrence.service');

        // Parse the UNTIL date from recurrence rule or default to 1 year
        let endDate = new Date(eventDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        const untilMatch = recurrenceRule.match(/UNTIL=([^;]+)/);
        if (untilMatch) {
            const untilStr = untilMatch[1];
            // Parse YYYYMMDDTHHMMSSZ format
            endDate = new Date(
                untilStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
            );
        }

        // Get all occurrences
        const occurrences = getEventOccurrences(
            { isRecurring: true, recurrenceRule, date: eventDate },
            eventDate,
            endDate
        );

        // Create individual events for each occurrence
        const createdEvents = [];
        for (const occurrenceDate of occurrences) {
            const event = await prisma.event.create({
                data: {
                    title,
                    description,
                    location,
                    category,
                    visibility,
                    date: occurrenceDate,
                    startTime,
                    endTime,
                    responseDeadlineHours: parseInt(responseDeadlineHours),
                    isRecurring: false, // Each event is now individual
                    setlistEnabled,
                },
            });
            createdEvents.push(event);

            // Auto-create attendance entries for all active users
            if (defaultAttendanceStatus && defaultAttendanceStatus !== 'none') {
                const activeUsers = await prisma.user.findMany({
                    where: { status: 'active' },
                    select: { id: true }
                });

                if (activeUsers.length > 0) {
                    await prisma.attendance.createMany({
                        data: activeUsers.map(user => ({
                            eventId: event.id,
                            userId: user.id,
                            status: defaultAttendanceStatus,
                        })),
                        skipDuplicates: true,
                    });
                }
            }
        }

        return res.status(201).json({
            message: `${createdEvents.length} Termine erfolgreich erstellt`,
            events: createdEvents,
            count: createdEvents.length,
        });
    }

    // Single event creation
    const event = await prisma.event.create({
        data: {
            title,
            description,
            location,
            category,
            visibility,
            date: eventDate,
            startTime,
            endTime,
            responseDeadlineHours: parseInt(responseDeadlineHours),
            isRecurring: false,
            setlistEnabled,
        },
    });

    notificationService.notifyEventCreated(event);

    // Auto-create attendance entries for all active users based on the selected status
    if (defaultAttendanceStatus && defaultAttendanceStatus !== 'none') {
        const activeUsers = await prisma.user.findMany({
            where: { status: 'active' },
            select: { id: true }
        });

        if (activeUsers.length > 0) {
            await prisma.attendance.createMany({
                data: activeUsers.map(user => ({
                    eventId: event.id,
                    userId: user.id,
                    status: defaultAttendanceStatus,
                })),
                skipDuplicates: true,
            });
        }
    }

    res.status(201).json({
        message: 'Event erfolgreich erstellt',
        event,
    });

});

/**
 * Update event
 * PUT /events/:id
 */
const updateEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert date string to Date object if provided
    if (updateData.date) {
        updateData.date = new Date(updateData.date);
    }

    const event = await prisma.event.update({
        where: { id: parseInt(id) },
        data: updateData,
    });

    res.json({
        message: 'Event erfolgreich aktualisiert',
        event,
    });

    notificationService.notifyEventUpdated(event);
});

/**
 * Delete event
 * DELETE /events/:id
 */
const deleteEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
    });

    await prisma.event.delete({
        where: { id: parseInt(id) },
    });

    if (event) {
        notificationService.notifyEventDeleted(event);
    }

    res.json({
        message: 'Event erfolgreich gelöscht',
    });
});

/**
 * Exclude a date from a recurring event
 * POST /events/:id/exclude-date
 */
const excludeDate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date } = req.body;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
    });

    if (!event) {
        throw new AppError('Event nicht gefunden', 404);
    }

    if (!event.isRecurring) {
        throw new AppError('Dieser Event ist kein Serientermin', 400);
    }

    const updatedExcludedDates = addExcludedDate(event.excludedDates, date);

    const updatedEvent = await prisma.event.update({
        where: { id: parseInt(id) },
        data: { excludedDates: updatedExcludedDates },
    });

    res.json({
        message: 'Datum erfolgreich ausgeschlossen',
        event: updatedEvent,
    });
});

/**
 * Set attendance for an event
 * POST /events/:id/attendance
 */
const setAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, comment, userId: targetUserId } = req.body;
    let userId = req.user.id;

    // If targetUserId is provided, check if requester is admin
    if (targetUserId) {
        if (req.user.role !== 'admin') {
            throw new AppError('Nur Administratoren können den Status anderer Mitglieder ändern', 403);
        }
        userId = targetUserId;
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
    });

    if (!event) {
        throw new AppError('Event nicht gefunden', 404);
    }


    const now = new Date();
    const isAdmin = req.user.role === 'admin';

    // Calculate response deadline from event date/time and responseDeadlineHours
    if (!isAdmin && event.responseDeadlineHours) {
        // Parse event date (stored as UTC midnight) and combine with startTime
        const eventDateObj = new Date(event.date);
        const [hours, minutes] = event.startTime.split(':').map(Number);

        // Use UTC date parts + local time construction
        const eventYear = eventDateObj.getUTCFullYear();
        const eventMonth = eventDateObj.getUTCMonth();
        const eventDay = eventDateObj.getUTCDate();

        // Construct the event datetime in local timezone
        const eventDateTime = new Date(eventYear, eventMonth, eventDay, hours, minutes, 0, 0);

        // Calculate deadline (X hours before event start)
        const deadline = new Date(eventDateTime.getTime() - event.responseDeadlineHours * 60 * 60 * 1000);

        if (now > deadline) {
            throw new AppError('Die Rückmeldefrist für diesen Termin ist abgelaufen', 400);
        }
    }

    // Also check if event is in the past (additional safety check)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(new Date(event.date).setHours(0, 0, 0, 0));

    if (eventDay < today && !isAdmin) {
        throw new AppError('Vergangene Termine können nicht mehr bearbeitet werden', 400);
    }


    // Upsert attendance
    const attendance = await prisma.attendance.upsert({
        where: {
            eventId_userId: {
                eventId: parseInt(id),
                userId,
            },
        },
        update: {
            status,
            comment,
        },
        create: {
            eventId: parseInt(id),
            userId,
            status,
            comment,
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    res.json({
        message: 'Teilnahme-Status aktualisiert',
        attendance,
    });
});

/**
 * Get all attendances for an event (including all active members)
 * GET /events/:id/attendances
 */
const getEventAttendances = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
    });

    if (!event) {
        throw new AppError('Event nicht gefunden', 404);
    }

    // Get all active members
    const activeMembers = await prisma.user.findMany({
        where: { status: 'active' },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            register: {
                select: { id: true, name: true },
            },
        },
        orderBy: { lastName: 'asc' },
    });

    // Get existing attendances
    const existingAttendances = await prisma.attendance.findMany({
        where: { eventId: parseInt(id) },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    register: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });

    // Create a map of userId -> attendance for quick lookup
    const attendanceMap = new Map();
    for (const att of existingAttendances) {
        attendanceMap.set(att.userId, att);
    }

    // Build full attendance list with all active members
    const allMemberAttendances = activeMembers.map(member => {
        const existing = attendanceMap.get(member.id);
        if (existing) {
            return existing;
        }
        // Member has no attendance record - return with null status
        return {
            id: null,
            status: null, // null = keine Rückmeldung
            comment: null,
            eventId: parseInt(id),
            userId: member.id,
            user: member,
            createdAt: null,
            updatedAt: null,
        };
    });

    // Group by status (including null for 'pending')
    const grouped = {
        yes: allMemberAttendances.filter(a => a.status === 'yes'),
        no: allMemberAttendances.filter(a => a.status === 'no'),
        maybe: allMemberAttendances.filter(a => a.status === 'maybe'),
        pending: allMemberAttendances.filter(a => a.status === null),
    };

    // Calculate actual deadline DateTime for frontend
    // Parse event date (stored as UTC midnight) and combine with startTime
    const eventDateObj = new Date(event.date);
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);

    // Use UTC date parts + local time construction
    const eventYear = eventDateObj.getUTCFullYear();
    const eventMonth = eventDateObj.getUTCMonth();
    const eventDay = eventDateObj.getUTCDate();

    // Construct the event datetime in UTC
    // Annahme: Die Datenbank speichert Datum in UTC. Die Uhrzeit ist aber "Lokalzeit" im Verein.
    // Um konsistent zu sein, konstruieren wir ein UTC-Datum aus den Komponenten
    const eventDateTimeUTC = new Date(Date.UTC(eventYear, eventMonth, eventDay, startHours, startMinutes, 0, 0));

    // Calculate deadline (X hours before event start)
    const deadline = new Date(eventDateTimeUTC.getTime() - (event.responseDeadlineHours || 48) * 60 * 60 * 1000);

    // Check if locked
    const now = new Date();
    const isAdmin = req.user.role === 'admin';
    let isResponseLocked = false;

    if (!isAdmin) {
        // Logik 1: Deadline vorbei?
        if (now > deadline) {
            isResponseLocked = true;
        }

        // Logik 2: Event vorbei? (Tages-Check in UTC)
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const eventDayUTC = new Date(Date.UTC(eventYear, eventMonth, eventDay));

        if (eventDayUTC < todayUTC) {
            isResponseLocked = true;
        }
    }

    res.json({
        attendances: allMemberAttendances,
        grouped,
        summary: {
            yes: grouped.yes.length,
            no: grouped.no.length,
            maybe: grouped.maybe.length,
            pending: grouped.pending.length,
            total: allMemberAttendances.length,
        },
        responseDeadlineHours: event.responseDeadlineHours,
        responseDeadline: deadline.toISOString(), // Send correctly calculated deadline
        isResponseLocked: isResponseLocked, // NEW: Server-side locking status
    });
});

/**
 * Send reminders to users who haven't responded
 * POST /events/:id/send-reminders
 */
const sendReminders = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
    });

    if (!event) {
        throw new AppError('Event nicht gefunden', 404);
    }

    // Get all active users who haven't responded
    const usersWithAttendance = await prisma.attendance.findMany({
        where: { eventId: parseInt(id) },
        select: { userId: true },
    });

    const respondedUserIds = usersWithAttendance.map(a => a.userId);

    const usersWithoutResponse = await prisma.user.findMany({
        where: {
            id: { notIn: respondedUserIds },
            status: 'active',
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
        },
    });

    if (usersWithoutResponse.length === 0) {
        return res.json({
            message: 'Alle Benutzer haben bereits geantwortet',
            sent: 0,
        });
    }

    const result = await sendBulkEventReminders(usersWithoutResponse, event);

    res.json({
        message: `Erinnerungen gesendet: ${result.sent} erfolgreich, ${result.failed} fehlgeschlagen`,
        ...result,
    });
});

/**
 * Delete multiple events at once
 * POST /events/bulk-delete
 */
const bulkDeleteEvents = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    // Fetch events before deletion to send notifications
    const eventsToDelete = await prisma.event.findMany({
        where: {
            id: { in: ids },
        },
    });

    // Delete all events with the given IDs
    const result = await prisma.event.deleteMany({
        where: {
            id: { in: ids },
        },
    });

    // Send notifications for each deleted event
    // We do this asynchronously to not block the response too long, 
    // but we use Promise.allSettled to ideally ensure they are triggered
    if (eventsToDelete.length > 0) {
        Promise.allSettled(eventsToDelete.map(event =>
            notificationService.notifyEventDeleted(event)
        )).catch(err => console.error('Error sending bulk delete notifications:', err));
    }

    res.json({
        message: `${result.count} Termine erfolgreich gelöscht`,
        count: result.count,
    });
});

/**
 * Add item to event setlist (sheet music, pause, or custom)
 * POST /events/:id/setlist
 */
const addItemToSetlist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, sheetMusicId, customTitle, customDescription, duration } = req.body;

    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
    });

    if (!event) {
        throw new AppError('Event nicht gefunden', 404);
    }

    // Type-specific validation
    if (type === 'sheetMusic') {
        if (!sheetMusicId) {
            throw new AppError('Sheet Music ID ist erforderlich', 400);
        }
        const sheetMusic = await prisma.sheetMusic.findUnique({
            where: { id: parseInt(sheetMusicId) },
        });
        if (!sheetMusic) {
            throw new AppError('Notenblatt nicht gefunden', 404);
        }
    } else if (type === 'pause' || type === 'custom') {
        if (!customTitle) {
            throw new AppError('Titel ist erforderlich', 400);
        }
    }

    // Get next position
    const maxPosition = await prisma.eventSheetMusic.aggregate({
        where: { eventId: parseInt(id) },
        _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    // Create item
    const item = await prisma.eventSheetMusic.create({
        data: {
            eventId: parseInt(id),
            type,
            sheetMusicId: type === 'sheetMusic' ? parseInt(sheetMusicId) : null,
            customTitle,
            customDescription,
            duration,
            position: nextPosition,
        },
        include: {
            sheetMusic: true,
        },
    });

    res.status(201).json({
        message: 'Element erfolgreich zum Programm hinzugefügt',
        item,
    });
});

/**
 * Update setlist item (only for custom/pause items)
 * PUT /events/:id/setlist/:itemId
 */
const updateSetlistItem = asyncHandler(async (req, res) => {
    const { id, itemId } = req.params;
    const { customTitle, customDescription, duration } = req.body;

    // Check if item exists
    const item = await prisma.eventSheetMusic.findFirst({
        where: {
            id: parseInt(itemId),
            eventId: parseInt(id),
        },
    });

    if (!item) {
        throw new AppError('Element nicht gefunden', 404);
    }

    // Allow updating sheetMusic items (customTitle, customDescription, duration)
    // if (item.type === 'sheetMusic') {
    //    throw new AppError('Notenblätter können nicht bearbeitet werden', 400);
    // }

    const updated = await prisma.eventSheetMusic.update({
        where: { id: parseInt(itemId) },
        data: {
            customTitle,
            customDescription,
            duration,
        },
        include: {
            sheetMusic: true,
        },
    });

    res.json({
        message: 'Element erfolgreich aktualisiert',
        item: updated,
    });
});

/**
 * Remove item from event setlist
 * DELETE /events/:id/setlist/:itemId
 */
const removeItemFromSetlist = asyncHandler(async (req, res) => {
    const { id, itemId } = req.params;

    // Delete the item
    await prisma.eventSheetMusic.delete({
        where: {
            id: parseInt(itemId),
        },
    });

    // Reorder remaining items
    const remaining = await prisma.eventSheetMusic.findMany({
        where: { eventId: parseInt(id) },
        orderBy: { position: 'asc' },
    });

    // Update positions sequentially
    for (let i = 0; i < remaining.length; i++) {
        await prisma.eventSheetMusic.update({
            where: { id: remaining[i].id },
            data: { position: i },
        });
    }

    res.json({
        message: 'Element erfolgreich aus dem Programm entfernt',
    });
});

/**
 * Reorder setlist items
 * PUT /events/:id/setlist/reorder
 */
const reorderSetlist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { items } = req.body;

    // Update all positions in a transaction using a 2-step process to avoid unique constraint violations
    // 1. Move to temporary negative positions
    // 2. Move to final positions
    await prisma.$transaction([
        ...items.map((item) =>
            prisma.eventSheetMusic.update({
                where: { id: item.id },
                data: { position: -1 * item.id }, // Temp position
            })
        ),
        ...items.map((item) =>
            prisma.eventSheetMusic.update({
                where: { id: item.id },
                data: { position: item.position },
            })
        ),
    ]);

    res.json({
        message: 'Reihenfolge erfolgreich aktualisiert',
    });
});

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    excludeDate,
    setAttendance,
    getEventAttendances,
    sendReminders,
    bulkDeleteEvents,
    addItemToSetlist,
    updateSetlistItem,
    removeItemFromSetlist,
    reorderSetlist,
};
