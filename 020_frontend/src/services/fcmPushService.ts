import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type Token,
  type ActionPerformed,
  type PushNotificationSchema,
} from '@capacitor/push-notifications';
import api from '@/lib/api';

/**
 * FCM Push Notification Service (native mobile only)
 * Handles FCM token registration via @capacitor/push-notifications
 * and syncs the token with the backend.
 */
export const fcmPushService = {
  /** True only when running inside a native iOS or Android app. */
  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  },

  /**
   * Request permission, register with FCM, and send the token to the backend.
   * Attaches all required Capacitor listeners.
   * Safe to call multiple times — listeners are replaced each time.
   */
  async registerAndSendToken(): Promise<void> {
    if (!this.isSupported()) return;

    // Remove stale listeners before re-registering
    await PushNotifications.removeAllListeners();

    // 1. Request OS permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('[FCM] Push notification permission not granted:', permission.receive);
      return;
    }

    // 2. Register with APNs / FCM — triggers 'registration' event on success
    await PushNotifications.register();

    // 3. On token received → send to backend
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[FCM] Token received:', token.value.substring(0, 20) + '...');
      await fcmPushService.sendTokenToBackend(token.value);
    });

    // 4. Log registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[FCM] Registration error:', error);
    });

    // 5. Handle foreground notifications
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('[FCM] Foreground notification:', notification.title);
      }
    );

    // 6. Handle notification tap / action
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('[FCM] Notification action performed:', action.actionId);
      }
    );
  },

  /**
   * POST the FCM token and device platform to the backend.
   */
  async sendTokenToBackend(fcmToken: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform(); // 'ios' | 'android'
      await api.post('/register-device', { fcmToken, platform });
      console.log('[FCM] Token registered on backend for platform:', platform);
    } catch (error) {
      console.error('[FCM] Failed to register device token with backend:', error);
    }
  },

  /** Cleanup — call on logout to stop receiving notifications. */
  async removeAllListeners(): Promise<void> {
    if (!this.isSupported()) return;
    await PushNotifications.removeAllListeners();
  },
};

export default fcmPushService;
