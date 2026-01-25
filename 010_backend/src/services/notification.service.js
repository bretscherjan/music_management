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
 * Send a specific scheduled reminder for an event
 * @param {number} eventId
 * @param {number} intervalMinutes
 */
/**
 * Send a specific scheduled reminder for an event
 * @param {number} userId
 * @param {Object} channels { email: boolean, push: boolean }
 * @param {number} intervalMinutes
 */
const sendScheduledReminder = async (eventId, userId, channels, intervalMinutes) => {
    try {
        console.log(`🔔 Processing Scheduled Reminder: Event ${eventId}, User ${userId}`);

        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            console.log(`⚠️ Event ${eventId} not found. Skipping reminder.`);
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { notificationSettings: true }
        });

        if (!user) {
            console.log(`⚠️ User ${userId} not found for reminder.`);
            return;
        }
        if (user.status !== 'active') {
            console.log(`⚠️ User ${userId} is not active (${user.status}). Skipping reminder.`);
            return;
        }

        // Calculate display text
        const timeDisplay = intervalMinutes >= 1440
            ? `${Math.round(intervalMinutes / 1440)} Tage(n)`
            : intervalMinutes >= 60
                ? `${Math.round(intervalMinutes / 60)} Stunden`
                : `${intervalMinutes} Minuten`;

        const formattedDate = new Date(event.date).toLocaleDateString('de-CH');

        // 1. Send Email
        console.log(`Checking email channel for user ${userId}. Enabled: ${channels.email}`);
        if (channels.email) {
            console.log(`Attempting to send EMAIL reminder to ${user.email}...`);
            await emailService.sendPersonalEventReminder(user, event, timeDisplay);
        }

        // 2. Send Push
        if (channels.push) {
            await pushService.sendPushToUser(user.id, {
                title: `Erinnerung: ${event.title}`,
                body: `Findet in ${timeDisplay} statt (${formattedDate})`,
                icon: '/logo.png',
                badge: '/logo.png',
                data: {
                    type: 'event_reminder',
                    eventId: event.id,
                    url: `/events/${event.id}`
                }
            });
        }

        console.log(`✅ Sent reminder to user ${user.firstName} for event ${event.id}`);

    } catch (error) {
        console.error('Error in sendScheduledReminder:', error);
    }
};

module.exports = {
    notifyEventCreated,
    notifyEventUpdated,
    notifyEventDeleted,
    notifyFileUploaded,
    notifyFileDeleted,
    sendScheduledReminder // New Queue-based
};
