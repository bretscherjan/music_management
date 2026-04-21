const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const userRoutes = require('./user.routes');
const fileRoutes = require('./file.routes');
const folderRoutes = require('./folder.routes');
const registerRoutes = require('./register.routes');
const settingsRoutes = require('./settings.routes');
const sheetMusicRoutes = require('./sheetMusic.routes');
const adminRoutes = require('./admin.routes');
const chatRoutes = require('./chat.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/folders', folderRoutes);
router.use('/registers', registerRoutes);
router.use('/settings', settingsRoutes);
router.use('/sheet-music', sheetMusicRoutes);
router.use('/calendar', require('./calendar.routes'));
router.use('/stats', require('./stats.routes'));
router.use('/music-folders', require('./musicFolder.routes'));
router.use('/public', require('./public.routes'));
router.use('/chat', chatRoutes);
router.use('/transcribe', require('./transcribe.routes'));
router.use('/protokoll', require('./protokoll.routes'));
router.use('/search', require('./search.routes'));
router.use('/polls', require('./poll.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/setlists', require('./setlist.routes'));

module.exports = router;

