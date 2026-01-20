const { PrismaClient } = require('@prisma/client');
const emailService = require('./email.service');
const pushService = require('./push.service');
const prisma = new PrismaClient();

/**
 * Notification Service
 * Handles logic for determining who to notify and sending the emails
 */

/**
 * Notify users about a new event
 * @param {Object} event - The created event
 */
const notifyEventCreated = async (event) => {
    try {
        console.log(`Starting notifications for new event: ${event.title}`);

        // 1. Prepare Email Promise
        const sendEmailsPromise = (async () => {
            try {
                const usersToNotify = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            notifyOnEventCreate: true
                        }
                    },
                    include: {
                        notificationSettings: true
                    }
                });

                const eligibleUsers = usersToNotify.filter(user => {
                    if (event.visibility === 'all') return true;
                    if (event.visibility === 'admin' && user.role !== 'admin') return false;
                    return true;
                });

                if (eligibleUsers.length > 0) {
                    console.log(`Sending emails to ${eligibleUsers.length} users`);
                    await Promise.allSettled(eligibleUsers.map(user =>
                        emailService.sendEventCreatedEmail(user, event)
                    ));
                }
            } catch (err) {
                console.error('Error in email notification block:', err);
            }
        })();

        // 2. Prepare Push Promise
        const sendPushPromise = (async () => {
            try {
                const usersForPush = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            pushNewEvents: true
                        }
                    }
                });

                const eligibleForPush = usersForPush.filter(user => {
                    if (event.visibility === 'all') return true;
                    if (event.visibility === 'admin' && user.role !== 'admin') return false;
                    return true;
                });

                if (eligibleForPush.length > 0) {
                    console.log(`Sending push to ${eligibleForPush.length} users`);
                    const formattedDate = new Date(event.date).toLocaleDateString('de-CH');
                    await Promise.allSettled(eligibleForPush.map(user =>
                        pushService.sendPushToUser(user.id, {
                            title: `Neuer Termin: ${event.title}`,
                            body: `${formattedDate} um ${event.startTime}`,
                            icon: '/logo.png',
                            badge: '/logo.png',
                            data: {
                                type: 'event_created',
                                eventId: event.id,
                                url: `/events/${event.id}`
                            }
                        })
                    ));
                }
            } catch (err) {
                console.error('Error in push notification block:', err);
            }
        })();

        // 3. Execute concurrently
        await Promise.all([sendEmailsPromise, sendPushPromise]);
        console.log('Finished all notifications for event creation');

    } catch (error) {
        console.error('Error in notifyEventCreated:', error);
    }
};

/**
 * Notify users about an updated event
 * @param {Object} event - The updated event
 * @param {Object} oldEvent - The event before update (optional, for diff)
 */
const notifyEventUpdated = async (event) => {
    try {
        console.log(`Starting notifications for updated event: ${event.title}`);

        const sendEmailsPromise = (async () => {
            try {
                const usersToNotify = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            notifyOnEventUpdate: true
                        }
                    }
                });

                if (usersToNotify.length > 0) {
                    console.log(`Sending emails to ${usersToNotify.length} users`);
                    await Promise.allSettled(usersToNotify.map(user =>
                        emailService.sendEventUpdatedEmail(user, event)
                    ));
                }
            } catch (err) {
                console.error('Error in email notification block:', err);
            }
        })();

        const sendPushPromise = (async () => {
            try {
                const usersForPush = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            pushEventUpdates: true
                        }
                    }
                });

                if (usersForPush.length > 0) {
                    console.log(`Sending push to ${usersForPush.length} users`);
                    const formattedDate = new Date(event.date).toLocaleDateString('de-CH');
                    await Promise.allSettled(usersForPush.map(user =>
                        pushService.sendPushToUser(user.id, {
                            title: `Termin aktualisiert: ${event.title}`,
                            body: `${formattedDate} um ${event.startTime}`,
                            icon: '/logo.png',
                            badge: '/logo.png',
                            data: {
                                type: 'event_updated',
                                eventId: event.id,
                                url: `/events/${event.id}`
                            }
                        })
                    ));
                }
            } catch (err) {
                console.error('Error in push notification block:', err);
            }
        })();

        await Promise.all([sendEmailsPromise, sendPushPromise]);
        console.log('Finished all notifications for event update');

    } catch (error) {
        console.error('Error in notifyEventUpdated:', error);
    }
};

/**
 * Notify users about a deleted event
 * @param {Object} event - The deleted event
 */
const notifyEventDeleted = async (event) => {
    try {
        console.log(`Starting notifications for deleted event: ${event.title}`);

        const sendEmailsPromise = (async () => {
            try {
                const usersToNotify = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            notifyOnEventDelete: true
                        }
                    }
                });

                if (usersToNotify.length > 0) {
                    console.log(`Sending emails to ${usersToNotify.length} users`);
                    await Promise.allSettled(usersToNotify.map(user =>
                        emailService.sendEventDeletedEmail(user, event)
                    ));
                }
            } catch (err) {
                console.error('Error in email notification block:', err);
            }
        })();

        const sendPushPromise = (async () => {
            try {
                const usersForPush = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            pushEventCancellations: true
                        }
                    }
                });

                if (usersForPush.length > 0) {
                    console.log(`Sending push to ${usersForPush.length} users`);
                    const formattedDate = new Date(event.date).toLocaleDateString('de-CH');
                    await Promise.allSettled(usersForPush.map(user =>
                        pushService.sendPushToUser(user.id, {
                            title: `Termin abgesagt: ${event.title}`,
                            body: `${formattedDate} wurde gelöscht`,
                            icon: '/logo.png',
                            badge: '/logo.png',
                            data: {
                                type: 'event_deleted',
                                eventId: event.id,
                                url: '/events'
                            }
                        })
                    ));
                }
            } catch (err) {
                console.error('Error in push notification block:', err);
            }
        })();

        await Promise.all([sendEmailsPromise, sendPushPromise]);
        console.log('Finished all notifications for event deletion');

    } catch (error) {
        console.error('Error in notifyEventDeleted:', error);
    }
};

/**
 * Notify users about a new file upload
 * @param {Object} file - The uploaded file
 */
const notifyFileUploaded = async (file) => {
    try {
        console.log(`Starting notifications for new file: ${file.originalName}`);

        const sendEmailsPromise = (async () => {
            try {
                const usersToNotify = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            notifyOnFileUpload: true
                        }
                    }
                });

                const eligibleUsers = usersToNotify.filter(user => {
                    if (file.visibility === 'all') return true;
                    if (file.visibility === 'admin' && user.role !== 'admin') return false;
                    if (file.visibility === 'register' && file.targetRegisterId !== user.registerId) return false;
                    return true;
                });

                if (eligibleUsers.length > 0) {
                    console.log(`Sending emails to ${eligibleUsers.length} users`);
                    await Promise.allSettled(eligibleUsers.map(user =>
                        emailService.sendFileUploadedEmail(user, file)
                    ));
                }
            } catch (err) {
                console.error('Error in email notification block:', err);
            }
        })();

        const sendPushPromise = (async () => {
            try {
                const usersForPush = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            pushNewFiles: true
                        }
                    }
                });

                const eligibleForPush = usersForPush.filter(user => {
                    if (file.visibility === 'all') return true;
                    if (file.visibility === 'admin' && user.role !== 'admin') return false;
                    if (file.visibility === 'register' && file.targetRegisterId !== user.registerId) return false;
                    return true;
                });

                if (eligibleForPush.length > 0) {
                    await Promise.allSettled(eligibleForPush.map(user =>
                        pushService.sendPushToUser(user.id, {
                            title: `Neue Datei: ${file.originalName}`,
                            body: 'Eine neue Datei wurde hochgeladen',
                            icon: '/logo.png',
                            badge: '/logo.png',
                            data: {
                                type: 'file_uploaded',
                                fileId: file.id,
                                url: '/files'
                            }
                        })
                    ));
                }
            } catch (err) {
                console.error('Error in push notification block:', err);
            }
        })();

        await Promise.all([sendEmailsPromise, sendPushPromise]);
        console.log('Finished all notifications for file upload');

    } catch (error) {
        console.error('Error in notifyFileUploaded:', error);
    }
};

/**
 * Notify users about a deleted file
 * @param {Object} file - The deleted file
 */
const notifyFileDeleted = async (file) => {
    try {
        console.log(`Starting notifications for deleted file: ${file.originalName}`);

        const sendEmailsPromise = (async () => {
            try {
                const usersToNotify = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            notifyOnFileDelete: true
                        }
                    }
                });

                const eligibleUsers = usersToNotify.filter(user => {
                    if (file.visibility === 'all') return true;
                    if (file.visibility === 'admin' && user.role !== 'admin') return false;
                    if (file.visibility === 'register' && file.targetRegisterId !== user.registerId) return false;
                    return true;
                });

                if (eligibleUsers.length > 0) {
                    console.log(`Sending emails to ${eligibleUsers.length} users`);
                    await Promise.allSettled(eligibleUsers.map(user =>
                        emailService.sendFileDeletedEmail(user, file)
                    ));
                }
            } catch (err) {
                console.error('Error in email notification block:', err);
            }
        })();

        const sendPushPromise = (async () => {
            try {
                const usersForPush = await prisma.user.findMany({
                    where: {
                        status: 'active',
                        notificationSettings: {
                            pushFileDeleted: true
                        }
                    }
                });

                const eligibleForPush = usersForPush.filter(user => {
                    if (file.visibility === 'all') return true;
                    if (file.visibility === 'admin' && user.role !== 'admin') return false;
                    if (file.visibility === 'register' && file.targetRegisterId !== user.registerId) return false;
                    return true;
                });

                if (eligibleForPush.length > 0) {
                    await Promise.allSettled(eligibleForPush.map(user =>
                        pushService.sendPushToUser(user.id, {
                            title: `Datei gelöscht: ${file.originalName}`,
                            body: 'Eine Datei wurde entfernt',
                            icon: '/logo.png',
                            badge: '/logo.png',
                            data: {
                                type: 'file_deleted',
                                fileId: file.id,
                                url: '/files'
                            }
                        })
                    ));
                }
            } catch (err) {
                console.error('Error in push notification block:', err);
            }
        })();

        await Promise.all([sendEmailsPromise, sendPushPromise]);
        console.log('Finished all notifications for file deletion');

    } catch (error) {
        console.error('Error in notifyFileDeleted:', error);
    }
};

/**
 * Send reminders for upcoming events
 * Should be called periodically (e.g., hourly)
 */
/**
 * Send reminders for upcoming events
 * Should be called periodically (e.g., hourly)
 */
const sendEventReminders = async () => {
    try {
        // 1. Get current time in Zurich
        const now = new Date();
        const zurichFormatter = new Intl.DateTimeFormat('de-CH', {
            timeZone: 'Europe/Zurich',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Parse parts to construct a Date object that represents "Zurich Time"
        // This is necessary because server might be in UTC.
        // Format of toLocaleString: "dd.mm.yyyy, hh:mm:ss" (depending on locale)
        // More robust: use formatToParts
        const parts = zurichFormatter.formatToParts(now);
        const part = (name) => parseInt(parts.find(p => p.type === name).value, 10);

        // Construct a generic date object that treats the current Zurich time as "local" numbers
        // IMPORTANT: Set seconds and milliseconds to 0 to avoid "Cron ran 5ms late" issues causing strict >= checks to fail
        const currentZurichTime = new Date(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), 0, 0);

        console.log(`[Reminder Check] Server Time (UTC): ${now.toISOString()}`);
        console.log(`[Reminder Check] Zurich Time Constructed: ${currentZurichTime.toLocaleString()}`);

        // Find users who have subscribed to reminders (either email OR push)
        const users = await prisma.user.findMany({
            where: {
                status: 'active',
                notificationSettings: {
                    OR: [
                        { notifyEventReminder: true },
                        { pushReminders: true }
                    ]
                }
            },
            include: {
                notificationSettings: true
            }
        });

        // Group users by reminder hours (e.g. 24, 48, 2)
        const usersByReminderTime = {};
        users.forEach(user => {
            const hours = user.notificationSettings?.reminderTimeBeforeHours || 24;
            if (!usersByReminderTime[hours]) {
                usersByReminderTime[hours] = [];
            }
            usersByReminderTime[hours].push(user);
        });

        // For each group, look for events starting in [ZurichTime + hours]
        for (const [hours, groupUsers] of Object.entries(usersByReminderTime)) {
            const h = parseInt(hours);

            // Calculate target Reminder Time Window in Zurich
            // logic: If event starts at 19:00, and h=1, we want to remind at 18:00.
            // So if currentZurichTime is 18:00, we check events at 19:00.
            // Target Event Time = Current Zurich Time + Reminder Hours
            const targetEventTimeStart = new Date(currentZurichTime.getTime() + (h * 60 * 60 * 1000));

            // Allow a small window (e.g., current hour to next hour) to catch tasks
            // Actually, since we run hourly, let's look for events starting in the 'target hour'.
            // Ex: Run at 18:05. h=1. Target = 19:05. Window: 19:05 - 20:05? 
            // Better: Run at 18:00. h=1. Target 19:00.
            // Let's create a 60 min window around the target time to be safe.
            const searchWindowStart = new Date(targetEventTimeStart);
            // searchWindowStart.setMinutes(0, 0, 0); // Align to hour start if cron is precise. 
            // Since cron is 0 * * * *, we are at the top of the hour.

            // To be robust: Look for events starting between [Target, Target + 1 Hour]
            const searchWindowEnd = new Date(searchWindowStart.getTime() + (60 * 60 * 1000));

            console.log(`[Reminder Group ${h}h] Searching for events between ${searchWindowStart.toLocaleString()} and ${searchWindowEnd.toLocaleString()} (Zurich Time)`);

            // DB Query: We need to search by date + startTime.
            // Since storing date and startTime separately is tricky for queries, we fetch events for the *day* and filter in memory.
            // This is safer for complex timezone logic than raw SQL if dataset is small.

            // "Day" for query needs to cover potential overflow (if target is tomorrow)
            const queryDayStart = new Date(searchWindowStart);
            queryDayStart.setHours(0, 0, 0, 0);
            const queryDayEnd = new Date(searchWindowEnd);
            queryDayEnd.setHours(23, 59, 59, 999);

            const potentialEvents = await prisma.event.findMany({
                where: {
                    date: {
                        gte: queryDayStart,
                        lte: queryDayEnd
                    }
                }
            });

            for (const event of potentialEvents) {
                // Construct Event Start DateTime in Zurich Time
                const eventDatePart = new Date(event.date); // This is UTC midnight usually
                const [eHour, eMin] = event.startTime.split(':').map(Number);

                // IMPORTANT: event.date is stored as UTC midnight. event.startTime is "19:00".
                // We want to combine them into a Zurich Date object.
                const eventZurichTime = new Date(
                    eventDatePart.getFullYear(),
                    eventDatePart.getMonth(),
                    eventDatePart.getDate(),
                    eHour,
                    eMin,
                    0
                );

                // Compare
                if (eventZurichTime >= searchWindowStart && eventZurichTime < searchWindowEnd) {
                    console.log(`✅ MATCH: Event "${event.title}" starts at ${eventZurichTime.toLocaleString()}. Sending ${h}h reminders.`);

                    // 1. Email
                    const usersForEmail = groupUsers.filter(user => user.notificationSettings?.notifyEventReminder === true);
                    if (usersForEmail.length > 0) {
                        Promise.allSettled(usersForEmail.map(user =>
                            emailService.sendEventReminderNotification(user, event, h)
                        )).catch(console.error);
                    }

                    // 2. Push
                    const usersForPush = groupUsers.filter(user => user.notificationSettings?.pushReminders === true);
                    if (usersForPush.length > 0) {
                        const formattedDate = eventZurichTime.toLocaleDateString('de-CH');
                        Promise.allSettled(usersForPush.map(user =>
                            pushService.sendPushToUser(user.id, {
                                title: `Erinnerung: ${event.title}`,
                                body: `Termin in ${h} Stunden - ${formattedDate} um ${event.startTime}`,
                                icon: '/logo.png',
                                badge: '/logo.png',
                                requireInteraction: true,
                                data: {
                                    type: 'reminder',
                                    eventId: event.id,
                                    url: `/events/${event.id}`
                                }
                            })
                        )).catch(console.error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in sendEventReminders:', error);
    }
};

module.exports = {
    notifyEventCreated,
    notifyEventUpdated,
    notifyEventDeleted,
    notifyFileUploaded,
    notifyFileDeleted,
    sendEventReminders
};
