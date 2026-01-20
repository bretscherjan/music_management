const pushService = require('../services/push.service');

/**
 * Push Notification Controller
 * Handles HTTP endpoints for web push subscription management
 */

/**
 * Get public VAPID key for frontend subscription
 * @route GET /api/push/vapid-public-key
 */
const getVapidPublicKey = async (req, res) => {
    try {
        const publicKey = pushService.getPublicVapidKey();

        if (!publicKey) {
            return res.status(500).json({
                success: false,
                message: 'VAPID keys not initialized'
            });
        }

        res.json({
            success: true,
            publicKey
        });
    } catch (error) {
        console.error('Error getting VAPID key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get VAPID public key'
        });
    }
};

/**
 * Subscribe to push notifications
 * @route POST /api/push/subscribe
 * @access Private (requires authentication)
 */
const subscribe = async (req, res) => {
    try {
        const userId = req.user.id; // From JWT middleware
        const { subscription } = req.body;

        // Validate subscription object
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription object'
            });
        }

        if (!subscription.keys.p256dh || !subscription.keys.auth) {
            return res.status(400).json({
                success: false,
                message: 'Missing encryption keys in subscription'
            });
        }

        // Get user agent for device tracking
        const userAgent = req.headers['user-agent'] || null;

        // Save subscription to database
        const savedSubscription = await pushService.saveSubscription(
            userId,
            subscription,
            userAgent
        );

        res.json({
            success: true,
            message: 'Successfully subscribed to push notifications',
            subscription: {
                id: savedSubscription.id,
                createdAt: savedSubscription.createdAt
            }
        });
    } catch (error) {
        console.error('Error subscribing to push:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save subscription'
        });
    }
};

/**
 * Unsubscribe from push notifications
 * @route DELETE /api/push/unsubscribe/:id
 * @access Private (requires authentication)
 */
const unsubscribe = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscriptionId = parseInt(req.params.id);

        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription ID'
            });
        }

        await pushService.deleteSubscription(subscriptionId, userId);

        res.json({
            success: true,
            message: 'Successfully unsubscribed'
        });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsubscribe'
        });
    }
};

/**
 * Get user's subscriptions
 * @route GET /api/push/subscriptions
 * @access Private (requires authentication)
 */
const getSubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;

        const subscriptions = await pushService.getUserSubscriptions(userId);

        // Don't send sensitive keys to frontend
        const sanitizedSubscriptions = subscriptions.map(sub => ({
            id: sub.id,
            endpoint: sub.endpoint,
            userAgent: sub.userAgent,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt
        }));

        res.json({
            success: true,
            subscriptions: sanitizedSubscriptions
        });
    } catch (error) {
        console.error('Error getting subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subscriptions'
        });
    }
};

/**
 * Send test push notification (for debugging)
 * @route POST /api/push/test
 * @access Private (requires authentication)
 */
const sendTestNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, body } = req.body;

        const payload = {
            title: title || 'Test Benachrichtigung',
            body: body || 'Dies ist eine Test-Push-Benachrichtigung von Musig Elgg',
            icon: '/logo.png',
            badge: '/logo.png',
            data: {
                type: 'test',
                url: '/',
                timestamp: new Date().toISOString()
            }
        };

        const result = await pushService.sendPushToUser(userId, payload);

        res.json({
            success: true,
            message: 'Test notification sent',
            result
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification'
        });
    }
};

module.exports = {
    getVapidPublicKey,
    subscribe,
    unsubscribe,
    getSubscriptions,
    sendTestNotification
};
