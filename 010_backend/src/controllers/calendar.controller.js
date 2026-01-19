const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ics = require('ics');

exports.getCalendarFeed = async (req, res) => {
    try {
        const { token } = req.params;
        console.log('Calendar feed requested for token:', token);

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

        // 2. Fetch events visible to the user
        // Reuse logic similar to getAllEvents but simplified for calendar feed
        // Ideally we filter by user's role/register visibility
        // For now, let's fetch all events that are not "admin" only, unless user is admin
        // Or simpler: fetch all events and filter in memory or query based on user role?
        // Let's mirror the basic visibility logic:
        // User is identified.
        // If user is member, show 'register' and 'all'.
        // If user is admin, show everything.
        // Also consider 'register' specific events if implemented later.

        const whereClause = {};

        // Simplistic visibility check based on UserRole
        if (user.role !== 'admin') {
            whereClause.visibility = {
                in: ['all', 'register']
            };
            // If event has restricted visibility to specific registers, we'd need more logic here.
            // But based on schema, EventVisibility is simple enum.
        }

        // Fetch events (maybe limit to -3 months to +2 years to save bandwidth?)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const events = await prisma.event.findMany({
            where: {
                ...whereClause,
                date: {
                    gte: startDate,
                }
            },
            orderBy: {
                date: 'asc',
            },
        });

        console.log(`Found ${events.length} events for token ${token}`);

        // 3. Transform to ICS format
        const icsEvents = events.map(event => {
            const start = new Date(event.date);
            // Parse startTime "HH:mm"
            const [startH, startM] = event.startTime.split(':').map(Number);
            const [endH, endM] = event.endTime.split(':').map(Number);

            start.setHours(startH, startM);
            const end = new Date(event.date);
            end.setHours(endH, endM);

            return {
                start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), startH, startM],
                end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), endH, endM],
                title: event.title,
                description: event.description || '',
                location: event.location || '',
                location: event.location || '',
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                uid: `event-${event.id}@musig-elgg.ch`,
                // url: '...' // could link back to app
            };
        });

        // 4. Generate ICS string
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
