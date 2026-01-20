const express = require('express');
const router = express.Router();
const pushController = require('../controllers/push.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * Push Notification Routes
 */

// Public route - Get VAPID public key (needed for subscription)
router.get('/vapid-public-key', pushController.getVapidPublicKey);

// Protected routes - Require authentication
router.post('/subscribe', authMiddleware, pushController.subscribe);
router.delete('/unsubscribe/:id', authMiddleware, pushController.unsubscribe);
router.get('/subscriptions', authMiddleware, pushController.getSubscriptions);
router.post('/test', authMiddleware, pushController.sendTestNotification);

module.exports = router;
