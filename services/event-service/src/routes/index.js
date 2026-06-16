const express = require('express');
const router = express.Router();
router.use('/events', require('./event.routes'));
router.use('/calendar', require('./calendar.routes'));
router.use('/polls', require('./poll.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/workspace', require('./workspace.routes'));
module.exports = router;