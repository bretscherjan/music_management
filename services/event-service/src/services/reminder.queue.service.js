const scheduleEventReminders = async () => {};
const cancelEventReminders = async () => {};
const syncReminders = async () => {};
const initializeReminderQueue = () => {};
const getQueueStatus = async () => ({ counts: {}, upcoming: [] });

module.exports = {
    initializeReminderQueue,
    scheduleEventReminders,
    cancelEventReminders,
    syncReminders,
    getQueueStatus,
    reminderQueue: null,
};
