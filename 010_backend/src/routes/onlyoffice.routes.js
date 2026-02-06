const express = require('express');
const router = express.Router();
const onlyOfficeController = require('../controllers/onlyoffice.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/onlyoffice/:id/config
 * @desc    Get editor configuration for a file
 * @access  Private
 */
router.get('/:id/config', authMiddleware, onlyOfficeController.getEditorConfig);

/**
 * @route   POST /api/onlyoffice/callback
 * @desc    Callback from OnlyOffice to save file
 * @access  Public (Validated via JWT in body)
 */
router.post('/callback', onlyOfficeController.callback);

module.exports = router;
