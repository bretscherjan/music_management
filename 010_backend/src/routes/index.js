const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const userRoutes = require('./user.routes');
const fileRoutes = require('./file.routes');
const folderRoutes = require('./folder.routes');
const newsRoutes = require('./news.routes');
const registerRoutes = require('./register.routes');
const settingsRoutes = require('./settings.routes');
const sheetMusicRoutes = require('./sheetMusic.routes');
const contactRoutes = require('./contact.routes');
const pushRoutes = require('./push.routes');
const adminRoutes = require('./admin.routes');
const cmsRoutes = require('./cms.routes');
const dbRoutes = require('./db.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/folders', folderRoutes);
router.use('/news', newsRoutes);
router.use('/registers', registerRoutes);
router.use('/settings', settingsRoutes);
router.use('/sheet-music', sheetMusicRoutes);
router.use('/contact', contactRoutes);
router.use('/calendar', require('./calendar.routes'));
router.use('/push', pushRoutes);
router.use('/stats', require('./stats.routes'));
router.use('/music-folders', require('./musicFolder.routes'));
router.use('/workspace', require('./workspace.routes'));
router.use('/public', require('./public.routes'));
router.use('/cms', cmsRoutes);
router.use('/db', dbRoutes);
// router.use('/onlyoffice', require('./onlyoffice.routes'));

module.exports = router;

