const express = require('express');
const router = express.Router();
const protokollController = require('../controllers/protokoll.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');

/**
 * @route   GET /api/protokoll/health
 * @desc    Check Whisper + LLM availability
 * @access  Admin
 */
router.get('/health', authMiddleware, permissionCheck('protokoll:read'), protokollController.checkHealth);

/**
 * @route   POST /api/protokoll/transcribe
 * @desc    Upload audio → transcribe (short files direct, long files chunked with SSE)
 * @access  Admin
 */
router.post(
    '/transcribe',
    authMiddleware,
    permissionCheck('protokoll:read'),
    protokollController.upload.single('audio'),
    protokollController.transcribe
);

/**
 * @route   POST /api/protokoll/summarize
 * @desc    Send raw text → get structured protocol via LLM
 * @access  Admin
 */
router.post('/summarize', authMiddleware, permissionCheck('protokoll:read'), protokollController.summarize);

/**
 * @route   POST /api/protokoll/export
 * @desc    Export protocol as TXT, PDF, or MD
 * @access  Admin
 */
router.post('/export', authMiddleware, permissionCheck('protokoll:read'), protokollController.exportProtokoll);

module.exports = router;
