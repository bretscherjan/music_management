import api from '@/lib/api';

const API_URL = '/push';

/**
 * Push Notification Service
 * Handles browser permissions, service worker registration, and backend subscription
 */

// Helper to convert VAPID key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const pushNotificationService = {
    /**
     * Check if push notifications are supported by the browser
     */
    isPushSupported: () => {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    },

    /**
     * Request notification permission from the user
     */
    requestNotificationPermission: async (): Promise<NotificationPermission> => {
        if (!pushNotificationService.isPushSupported()) {
            return 'denied';
        }
        return await Notification.requestPermission();
    },

    /**
     * Get current subscription status (permission)
     */
    getSubscriptionStatus: async (): Promise<'granted' | 'denied' | 'default' | 'unsupported'> => {
        if (!pushNotificationService.isPushSupported()) {
            return 'unsupported';
        }
        return Notification.permission;
    },

    /**
     * Check if there's an active push subscription
     */
    hasActiveSubscription: async (): Promise<boolean> => {
        if (!pushNotificationService.isPushSupported()) {
            return false;
        }
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) return false;

            const subscription = await registration.pushManager.getSubscription();
            return subscription !== null;
        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    },

    /**
     * Subscribe to push notifications
     */
    subscribeToPushNotifications: async () => {
        if (!pushNotificationService.isPushSupported()) {
            throw new Error('Push notifications not supported');
        }

        // 1. Request Permission
        const permission = await pushNotificationService.requestNotificationPermission();
        if (permission !== 'granted') {
            throw new Error('Permission denied');
        }

        // 2. Register Service Worker (if not already)
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        await navigator.serviceWorker.ready;

        // 3. Get VAPID Public Key from Backend
        const response = await api.get(`${API_URL}/vapid-public-key`);
        const vapidPublicKey = response.data.publicKey;


        // 4. Subscribe to PushManager
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });


        // 5. Send Subscription to Backend
        await api.post(`${API_URL}/subscribe`, {
            subscription: subscription.toJSON()
        });


        return subscription;
    },

    /**
     * Unsubscribe from push notifications
     */
    unsubscribeFromPushNotifications: async () => {
        if (!pushNotificationService.isPushSupported()) {
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Unsubscribe locally first
            await subscription.unsubscribe();

            // Delete subscription from backend
            try {
                const subsResponse = await api.get(`${API_URL}/subscriptions`);
                const userSubs = subsResponse.data.subscriptions;
                const matchingSub = userSubs.find((s: any) => s.endpoint === subscription.endpoint);

                if (matchingSub) {
                    await api.delete(`${API_URL}/unsubscribe/${matchingSub.id}`);
                }
            } catch (err) {
                console.error('Error syncing unsubscribe with backend', err);
                // Don't throw - local unsubscribe succeeded
            }
        }
    },

    /**
     * Sync local subscription with backend
     * Ensures that if the browser is subscribed, the backend also has the subscription
     * Also checks for VAPID key rotation
     */
    syncSubscription: async () => {
        if (!pushNotificationService.isPushSupported()) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // 1. Check for VAPID key mismatch
                try {
                    const response = await api.get(`${API_URL}/vapid-public-key`);
                    const serverKey = response.data.publicKey;

                    if (subscription.options.applicationServerKey) {
                        // Convert ArrayBuffer to Base64 string for comparison
                        const localKeyArray = new Uint8Array(subscription.options.applicationServerKey);
                        let localKey = btoa(String.fromCharCode.apply(null, Array.from(localKeyArray)));

                        // Fix base64url format differences (padding, +, /)
                        localKey = localKey.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                        const normalizedServerKey = serverKey.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                        // console.log('Checking VAPID keys:', { local: localKey, server: normalizedServerKey });

                        if (localKey !== normalizedServerKey) {
                            console.warn('VAPID key mismatch detected. Re-subscribing...');
                            await subscription.unsubscribe();
                            await pushNotificationService.subscribeToPushNotifications();
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Error checking VAPID key:', err);
                }

                // 2. Sync if keys match
                await api.post(`${API_URL}/subscribe`, {
                    subscription: subscription.toJSON()
                });
            }
        } catch (error) {
            console.error('Error syncing subscription:', error);
        }
    },

    /**
     * Send a test notification
     */
    sendTestNotification: async () => {
        const response = await api.post(`${API_URL}/test`, {
            title: 'Test',
            body: 'Funktioniert!'
        });
        return response.data;
    }
};
