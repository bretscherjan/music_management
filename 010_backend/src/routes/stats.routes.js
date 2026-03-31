const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
const statsController = require('../controllers/stats.controller');

/**
 * @route   GET /api/stats/repertoire
 * @desc    Get repertoire statistics
 * @access  Admin only
 */
router.get('/repertoire', authMiddleware, permissionCheck('statistics:read'), statsController.getRepertoireStats);

/**
 * @route   GET /api/stats/repertoire/export
 * @desc    Export repertoire statistics as PDF
 * @access  Admin only
 */
router.get('/repertoire/export', authMiddleware, permissionCheck('statistics:read'), statsController.exportRepertoirePdf);

/**
 * @route   GET /api/stats/attendance
 * @desc    Get attendance statistics
 * @access  Admin only
 */
router.get('/attendance', authMiddleware, permissionCheck('statistics:read'), statsController.getAttendanceStats);

/**
 * @route   GET /api/stats/attendance/export
 * @desc    Export attendance statistics as PDF
 * @access  Admin only
 */
router.get('/attendance/export', authMiddleware, permissionCheck('statistics:read'), statsController.exportAttendancePdf);

module.exports = router;
