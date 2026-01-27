const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const statsController = require('../controllers/stats.controller');

/**
 * @route   GET /api/stats/repertoire
 * @desc    Get repertoire statistics
 * @access  Admin only
 */
router.get('/repertoire', authMiddleware, adminOnly, statsController.getRepertoireStats);

/**
 * @route   GET /api/stats/repertoire/export
 * @desc    Export repertoire statistics as PDF
 * @access  Admin only
 */
router.get('/repertoire/export', authMiddleware, adminOnly, statsController.exportRepertoirePdf);

/**
 * @route   GET /api/stats/attendance
 * @desc    Get attendance statistics
 * @access  Admin only
 */
router.get('/attendance', authMiddleware, adminOnly, statsController.getAttendanceStats);

/**
 * @route   GET /api/stats/attendance/export
 * @desc    Export attendance statistics as PDF
 * @access  Admin only
 */
router.get('/attendance/export', authMiddleware, adminOnly, statsController.exportAttendancePdf);

module.exports = router;
