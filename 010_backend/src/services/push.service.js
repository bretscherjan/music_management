const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Web Push Service
 * Handles web push notification sending using the web-push library
 */

let vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:info@musig-elgg.ch'
};

/**
 * Initialize the push service with VAPID keys
 * VAPID keys should be stored in environment variables
 * If not present, they will be generated (for development only)
 */
const initializePushService = () => {
    try {
        // Load VAPID keys from environment
        vapidKeys.publicKey = process.env.VAPID_PUBLIC_KEY || '';
        vapidKeys.privateKey = process.env.VAPID_PRIVATE_KEY || '';
        vapidKeys.subject = process.env.VAPID_SUBJECT || 'mailto:info@musig-elgg.ch';

        // Generate new keys if not present (development only)
        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            console.warn('⚠️ VAPID keys not found in .env - Generating new keys...');
            console.warn('⚠️ In production, these should be stored in .env file!');

            const generatedKeys = webpush.generateVAPIDKeys();
            vapidKeys.publicKey = generatedKeys.publicKey;
            vapidKeys.privateKey = generatedKeys.privateKey;

            console.log('\n📋 Add these to your .env file:');
            console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
            console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
            console.log(`VAPID_SUBJECT=${vapidKeys.subject}\n`);
        }

        // Set VAPID details for web-push library
        webpush.setVapidDetails(
            vapidKeys.subject,
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );

        console.log('✅ Push Service initialized successfully');
        console.log(`📧 VAPID Subject: ${vapidKeys.subject}`);
        console.log(`🔑 Public Key: ${vapidKeys.publicKey.substring(0, 20)}...`);
    } catch (error) {
        console.error('❌ Failed to initialize Push Service:', error);
    }
};

/**
 * Get the public VAPID key for frontend subscription
 * @returns {string} Public VAPID key
 */
const getPublicVapidKey = () => {
    return vapidKeys.publicKey;
};

/**
 * Send a push notification to a single subscription
 * @param {Object} subscription - PushSubscription object from database
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Result object
 */
const sendPushNotification = async (subscription, payload) => {
    try {
        // Reconstruct the subscription object for web-push
        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        };

        // Send the notification
        const result = await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            {
                vapidDetails: {
                    subject: vapidKeys.subject,
                    publicKey: vapidKeys.publicKey,
                    privateKey: vapidKeys.privateKey
                }
            }
        );

        return { success: true, statusCode: result.statusCode };
    } catch (error) {
        // Handle gone subscriptions (410 status)
        if (error.statusCode === 410) {
            console.log(`🗑️ Subscription expired, removing: ${subscription.id}`);

            // Delete the expired subscription from database
            await prisma.pushSubscription.delete({
                where: { id: subscription.id }
            }).catch(err => console.error('Error deleting subscription:', err));

            return { success: false, error: 'Subscription expired', removed: true };
        }

        // Handle VAPID key mismatch (403 with specific message)
        if (error.statusCode === 403 && error.body && error.body.includes('VAPID credentials')) {
            console.log(`🔑 VAPID key mismatch, removing invalid subscription: ${subscription.id}`);

            // Delete the subscription with wrong VAPID keys
            await prisma.pushSubscription.delete({
                where: { id: subscription.id }
            }).catch(err => console.error('Error deleting subscription:', err));

            return { success: false, error: 'VAPID key mismatch - subscription removed', removed: true };
        }

        // Other errors
        console.error('Push notification error:', error);
        return { success: false, error: error.message, statusCode: error.statusCode };
    }
};

/**
 * Send push notification to all subscriptions of a user
 * @param {number} userId - User ID
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Results summary
 */
const sendPushToUser = async (userId, payload) => {
    try {
        // Get all subscriptions for this user
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        if (subscriptions.length === 0) {
            return { success: true, sent: 0, total: 0, message: 'No subscriptions found' };
        }

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(sub => sendPushNotification(sub, payload))
        );

        // Count successes and failures
        const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;

        return {
            success: true,
            sent,
            failed,
            total: subscriptions.length
        };
    } catch (error) {
        console.error('Error sending push to user:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notifications to multiple users
 * @param {number[]} userIds - Array of user IDs
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Results summary
 */
const sendBulkPush = async (userIds, payload) => {
    try {
        const results = await Promise.allSettled(
            userIds.map(userId => sendPushToUser(userId, payload))
        );

        // Aggregate results
        let totalSent = 0;
        let totalFailed = 0;
        let totalSubscriptions = 0;

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
                totalSent += result.value.sent || 0;
                totalFailed += result.value.failed || 0;
                totalSubscriptions += result.value.total || 0;
            }
        });

        return {
            success: true,
            sent: totalSent,
            failed: totalFailed,
            total: totalSubscriptions,
            users: userIds.length
        };
    } catch (error) {
        console.error('Error sending bulk push:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Save a new push subscription to database
 * @param {number} userId - User ID
 * @param {Object} subscription - PushSubscription object from browser
 * @param {string} userAgent - User agent string
 * @returns {Promise<Object>} Created subscription
 */
const saveSubscription = async (userId, subscription, userAgent = null) => {
    try {
        // Use upsert to handle potential race conditions with duplicate requests
        return await prisma.pushSubscription.upsert({
            where: {
                endpoint: subscription.endpoint
            },
            create: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent
            },
            update: {
                userId, // Update owner if changed
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent,
                updatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error saving subscription:', error);
        throw error;
    }
};

/**
 * Delete a subscription
 * @param {number} subscriptionId - Subscription ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
const deleteSubscription = async (subscriptionId, userId) => {
    try {
        await prisma.pushSubscription.deleteMany({
            where: {
                id: subscriptionId,
                userId // Ensure user can only delete their own subscriptions
            }
        });
        return true;
    } catch (error) {
        console.error('Error deleting subscription:', error);
        throw error;
    }
};

/**
 * Get all subscriptions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of subscriptions
 */
const getUserSubscriptions = async (userId) => {
    try {
        return await prisma.pushSubscription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Error getting user subscriptions:', error);
        throw error;
    }
};

module.exports = {
    initializePushService,
    getPublicVapidKey,
    sendPushNotification,
    sendPushToUser,
    sendBulkPush,
    saveSubscription,
    deleteSubscription,
    getUserSubscriptions
};
