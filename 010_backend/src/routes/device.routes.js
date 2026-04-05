const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * Native Device Token Routes (FCM)
 */
router.post('/', authMiddleware, deviceController.registerDevice);
router.delete('/', authMiddleware, deviceController.unregisterDevice);

module.exports = router;
