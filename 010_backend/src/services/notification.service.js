const { PrismaClient } = require('@prisma/client');
const emailService = require('./email.service');

const prisma = new PrismaClient();

const eventIsVisibleToUser = (event, user) => {
    if (event.visibility === 'all') return true;
    if (event.visibility === 'admin') return user.role === 'admin';
    return true;
};

const fileIsVisibleToUser = (file, user) => {
    if (file.visibility === 'all') return true;
    if (file.visibility === 'admin') return user.role === 'admin';
    if (file.visibility === 'register') return file.targetRegisterId === user.registerId;
    return true;
};

const notifyUsers = async ({ where, visibilityFilter, sendEmail }) => {
    const users = await prisma.user.findMany({
        where: {
            status: 'active',
            ...where,
        },
    });

    const eligibleUsers = visibilityFilter ? users.filter(visibilityFilter) : users;
    await Promise.allSettled(eligibleUsers.map(sendEmail));
};

const notifyEventCreated = async (event) => {
    try {
        await notifyUsers({
            where: { notificationSettings: { notifyOnEventCreate: true } },
            visibilityFilter: user => eventIsVisibleToUser(event, user),
            sendEmail: user => emailService.sendEventCreatedEmail(user, event),
        });
    } catch (error) {
        console.error('Error in notifyEventCreated:', error);
    }
};

const notifyEventUpdated = async (event) => {
    try {
        await notifyUsers({
            where: { notificationSettings: { notifyOnEventUpdate: true } },
            sendEmail: user => emailService.sendEventUpdatedEmail(user, event),
        });
    } catch (error) {
        console.error('Error in notifyEventUpdated:', error);
    }
};

const notifyEventDeleted = async (event) => {
    try {
        await notifyUsers({
            where: { notificationSettings: { notifyOnEventDelete: true } },
            sendEmail: user => emailService.sendEventDeletedEmail(user, event),
        });
    } catch (error) {
        console.error('Error in notifyEventDeleted:', error);
    }
};

const notifyFileUploaded = async (file) => {
    try {
        await notifyUsers({
            where: { notificationSettings: { notifyOnFileUpload: true } },
            visibilityFilter: user => fileIsVisibleToUser(file, user),
            sendEmail: user => emailService.sendFileUploadedEmail(user, file),
        });
    } catch (error) {
        console.error('Error in notifyFileUploaded:', error);
    }
};

const notifyFileDeleted = async (file) => {
    try {
        await notifyUsers({
            where: { notificationSettings: { notifyOnFileDelete: true } },
            visibilityFilter: user => fileIsVisibleToUser(file, user),
            sendEmail: user => emailService.sendFileDeletedEmail(user, file),
        });
    } catch (error) {
        console.error('Error in notifyFileDeleted:', error);
    }
};

const sendScheduledReminder = async (eventId, userId, channels, intervalMinutes) => {
    try {
        if (!channels.email) return;

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.status !== 'active') return;

        const timeDisplay = intervalMinutes >= 1440
            ? `${Math.round(intervalMinutes / 1440)} Tage(n)`
            : intervalMinutes >= 60
                ? `${Math.round(intervalMinutes / 60)} Stunden`
                : `${intervalMinutes} Minuten`;

        await emailService.sendPersonalEventReminder(user, event, timeDisplay);
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
    sendScheduledReminder,
};
