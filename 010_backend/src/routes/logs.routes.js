const express = require('express');
const router  = express.Router();
const { authMiddleware }  = require('../middlewares/auth.middleware');
const { adminOnly }       = require('../middlewares/roleCheck.middleware');
const { getLogs, getLogStats, getLogsByDate, getAvailableDates } = require('../controllers/logs.controller');

router.use(authMiddleware);
router.use(adminOnly);

router.get('/',                getLogs);
router.get('/stats',           getLogStats);
router.get('/date',            getLogsByDate);
router.get('/available-dates', getAvailableDates);

module.exports = router;
