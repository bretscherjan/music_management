const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');

// Public route but protected by token in URL
router.get('/:token', calendarController.getCalendarFeed);

module.exports = router;
