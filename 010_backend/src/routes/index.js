const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const userRoutes = require('./user.routes');
const fileRoutes = require('./file.routes');
const newsRoutes = require('./news.routes');
const registerRoutes = require('./register.routes');
const settingsRoutes = require('./settings.routes');
const sheetMusicRoutes = require('./sheetMusic.routes');
const contactRoutes = require('./contact.routes');
const pushRoutes = require('./push.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/news', newsRoutes);
router.use('/registers', registerRoutes);
router.use('/settings', settingsRoutes);
router.use('/sheet-music', sheetMusicRoutes);
router.use('/contact', contactRoutes);
router.use('/calendar', require('./calendar.routes'));
router.use('/push', pushRoutes);

// TEMPORARY: Test endpoint for reminders
router.get('/test/reminders', async (req, res) => {
    try {
        const notificationService = require('../services/notification.service');
        console.log('manual trigger of sendEventReminders via /test/reminders');
        await notificationService.sendEventReminders();
        res.json({ message: 'Reminder check triggered. Check server logs.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

