const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');

// All settings routes require authentication and admin role
router.use(authMiddleware);
router.use(permissionCheck('db:write'));

// GET /settings - Get all settings
router.get('/', settingsController.getSettings);

// GET /settings/:key - Get a specific setting
router.get('/:key', settingsController.getSetting);

// PUT /settings/:key - Update a setting
router.put('/:key', settingsController.updateSetting);

module.exports = router;

