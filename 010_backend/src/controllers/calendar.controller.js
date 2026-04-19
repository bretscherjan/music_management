const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ics = require('ics');

const VALID_CATEGORIES = ['rehearsal', 'performance', 'other'];

function buildGoogleMapsLocation(location) {
    if (!location) return '';
    const encoded = encodeURIComponent(location);
    return `https://maps.google.com/?q=${encoded} [${location}]`;
}

exports.getCalendarFeed = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).send('Token missing');
        }

        // 1. Find user by token
        const user = await prisma.user.findUnique({
            where: { calendarToken: token },
        });

        if (!user) {
            return res.status(404).send('Invalid calendar token');
        }

        // 2. Resolve filter params (query params override stored preferences)
        const storedPrefs = user.calendarPreferences ?? {};

        const onlyConfirmed = req.query.onlyConfirmed !== undefined
            ? req.query.onlyConfirmed === 'true'
            : Boolean(storedPrefs.onlyConfirmed);

        let categories = [];
        if (req.query.categories) {
            categories = req.query.categories
                .split(',')
                .map(c => c.trim())
                .filter(c => VALID_CATEGORIES.includes(c));
        } else if (Array.isArray(storedPrefs.categories) && storedPrefs.categories.length > 0) {
            categories = storedPrefs.categories.filter(c => VALID_CATEGORIES.includes(c));
        }

        const reminderMinutes = req.query.reminderMinutes !== undefined
            ? parseInt(req.query.reminderMinutes, 10) || 0
            : (Number(storedPrefs.reminderMinutes) || 0);

        // 3. Build event query
        const whereClause = {};

        if (user.role !== 'admin') {
            whereClause.visibility = { in: ['all', 'register'] };
        }

        if (categories.length > 0) {
            whereClause.category = { in: categories };
        }

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const eventsQuery = {
            where: {
                ...whereClause,
                date: { gte: startDate },
            },
            orderBy: { date: 'asc' },
        };

        // When onlyConfirmed, join attendances for this user
        if (onlyConfirmed) {
            eventsQuery.where.attendances = {
                some: {
                    userId: user.id,
                    status: 'yes',
                },
            };
        }

        const events = await prisma.event.findMany(eventsQuery);

        // 4. Transform to ICS format
        const icsEvents = events.map(event => {
            const start = new Date(event.date);
            const [startH, startM] = event.startTime.split(':').map(Number);
            const [endH, endM] = event.endTime.split(':').map(Number);

            start.setHours(startH, startM);
            const end = new Date(event.date);
            end.setHours(endH, endM);

            const icsEvent = {
                start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), startH, startM],
                end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), endH, endM],
                title: event.title,
                description: event.description || '',
                location: event.location ? buildGoogleMapsLocation(event.location) : '',
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                uid: `event-${event.id}@musig-elgg.ch`,
            };

            // Add VALARM if reminder is configured
            if (reminderMinutes > 0) {
                icsEvent.alarms = [
                    {
                        action: 'display',
                        description: `Erinnerung: ${event.title}`,
                        trigger: { minutes: reminderMinutes, before: true },
                    },
                ];
            }

            return icsEvent;
        });

        // 5. Generate ICS string
        ics.createEvents(icsEvents, (error, value) => {
            if (error) {
                console.error('Error generating ICS:', error);
                return res.status(500).send('Error generating calendar file');
            }

            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="musig_elgg.ics"');
            res.send(value);
        });

    } catch (error) {
        console.error('Error in getCalendarFeed:', error);
        res.status(500).send('Internal Server Error');
    }
};
