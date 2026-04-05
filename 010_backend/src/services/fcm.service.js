const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let firebaseApp = null;

/**
 * Lazily initialize firebase-admin.
 * Requires either:
 *   a) GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service-account JSON, or
 *   b) FCM_SERVICE_ACCOUNT_JSON env var containing the service-account JSON as a string.
 */
function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const admin = require('firebase-admin');

  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

  let credential;

  if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
    // Inline JSON string (useful for PaaS / Docker secrets)
    const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Path to service-account JSON file
    credential = admin.credential.applicationDefault();
  } else {
    throw new Error(
      'Firebase Admin not configured. Set FCM_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }

  firebaseApp = admin.initializeApp({ credential });
  console.log('✅ Firebase Admin initialized');
  return firebaseApp;
}

/**
 * Send an FCM notification to a single device token.
 * @param {string} fcmToken - The FCM registration token of the target device.
 * @param {object} notification - { title: string, body: string }
 * @param {object} [data] - Optional key-value data payload.
 */
const sendToDevice = async (fcmToken, notification, data = {}) => {
  const admin = require('firebase-admin');
  const app = getFirebaseApp();

  const message = {
    token: fcmToken,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: {
      priority: 'high',
      notification: { sound: 'default' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const response = await admin.messaging(app).send(message);
    return { success: true, messageId: response };
  } catch (error) {
    // Token no longer valid → clean up
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      await prisma.deviceToken.deleteMany({ where: { fcmToken } }).catch(() => {});
      return { success: false, error: 'Token invalid, removed', removed: true };
    }
    console.error('[fcm] sendToDevice error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send an FCM notification to ALL registered devices of a user.
 * @param {number} userId
 * @param {object} notification - { title, body }
 * @param {object} [data]
 */
const sendToUser = async (userId, notification, data = {}) => {
  const tokens = await prisma.deviceToken.findMany({ where: { userId } });

  if (tokens.length === 0) {
    return { success: true, sent: 0, total: 0, message: 'No device tokens found' };
  }

  const results = await Promise.allSettled(
    tokens.map((t) => sendToDevice(t.fcmToken, notification, data))
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  return { success: true, sent, total: tokens.length };
};

/**
 * Send an FCM notification to multiple users at once.
 * @param {number[]} userIds
 * @param {object} notification - { title, body }
 * @param {object} [data]
 */
const sendToUsers = async (userIds, notification, data = {}) => {
  const results = await Promise.allSettled(
    userIds.map((id) => sendToUser(id, notification, data))
  );

  const totalSent = results.reduce(
    (sum, r) => sum + (r.status === 'fulfilled' ? (r.value.sent ?? 0) : 0),
    0
  );

  return { success: true, sent: totalSent, users: userIds.length };
};

module.exports = { sendToDevice, sendToUser, sendToUsers };
