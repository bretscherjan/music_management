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

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/news', newsRoutes);
router.use('/registers', registerRoutes);
router.use('/settings', settingsRoutes);
router.use('/sheet-music', sheetMusicRoutes);

module.exports = router;

