const { PrismaClient } = require('@prisma/client');
// const emailService = require('./email.service');

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
    // Email notifications disabled.
};

const notifyEventUpdated = async (event) => {
    // Email notifications disabled.
};

const notifyEventDeleted = async (event) => {
    // Email notifications disabled.
};

const notifyFileUploaded = async (file) => {
    // Email notifications disabled.
};

const notifyFileDeleted = async (file) => {
    // Email notifications disabled.
};

const sendScheduledReminder = async (eventId, userId, channels, intervalMinutes) => {
    // Scheduled reminders are disabled because email delivery is removed.
};

module.exports = {
    notifyEventCreated,
    notifyEventUpdated,
    notifyEventDeleted,
    notifyFileUploaded,
    notifyFileDeleted,
    sendScheduledReminder,
};
