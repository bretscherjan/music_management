const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');

/**
 * @route   GET /api/stats/attendance-summary
 * @desc    Get attendance statistics
 * @access  Admin only
 */
router.get('/attendance-summary', authMiddleware, adminOnly, statsController.getAttendanceSummary);

module.exports = router;
