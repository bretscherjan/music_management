const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * POST /api/register-device
 * Stores or refreshes an FCM device token for the authenticated user.
 */
const registerDevice = async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    const userId = req.user.id;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({ message: 'fcmToken is required' });
    }

    const validPlatforms = ['ios', 'android', 'web'];
    if (!platform || !validPlatforms.includes(platform)) {
      return res.status(400).json({ message: `platform must be one of: ${validPlatforms.join(', ')}` });
    }

    const deviceToken = await prisma.deviceToken.upsert({
      where: { fcmToken },
      create: { userId, fcmToken, platform },
      update: { userId, platform, updatedAt: new Date() },
    });

    return res.status(200).json({ message: 'Device registered', id: deviceToken.id });
  } catch (error) {
    console.error('[device] registerDevice error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * DELETE /api/register-device
 * Removes the FCM token for the authenticated user (call on logout).
 */
const unregisterDevice = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ message: 'fcmToken is required' });
    }

    await prisma.deviceToken.deleteMany({
      where: { fcmToken, userId },
    });

    return res.status(200).json({ message: 'Device unregistered' });
  } catch (error) {
    console.error('[device] unregisterDevice error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { registerDevice, unregisterDevice };
