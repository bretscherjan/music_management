const express = require('express');
const router = express.Router();
const transcribeController = require('../controllers/transcribe.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');

/**
 * @route   GET /api/transcribe/health
 * @desc    Check Whisper server availability
 * @access  Admin
 */
router.get('/health', authMiddleware, permissionCheck('protokoll:read'), transcribeController.checkHealth);

/**
 * @route   POST /api/transcribe
 * @desc    Transcribe audio to Standard German text
 * @access  Admin
 */
router.post(
    '/',
    authMiddleware,
    permissionCheck('protokoll:read'),
    transcribeController.upload.single('audio'),
    transcribeController.transcribe
);

module.exports = router;
