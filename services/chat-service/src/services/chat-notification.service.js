const { PrismaClient } = require('@prisma/client');
const websocketService = require('./websocket.service');

const prisma = new PrismaClient();

/**
 * Keeps chat notification hooks in one place.
 * Mobile push notifications have been removed; unread counters and websocket
 * updates continue to notify users inside the app.
 */
class ChatNotificationService {
    async notifyNewMessage(chatId, senderId) {
        try {
            const chat = await prisma.chat.findUnique({
                where: { id: chatId },
                include: {
                    participants: {
                        where: { userId: { not: senderId } },
                        select: { userId: true, muted: true },
                    },
                },
            });

            if (!chat) return;

            const onlineUsers = websocketService.getOnlineUsersList();
            const onlineUserIds = new Set(onlineUsers.map(user => user.id));

            for (const participant of chat.participants) {
                if (participant.muted || onlineUserIds.has(participant.userId)) {
                    continue;
                }
            }
        } catch (error) {
            console.error('Error in notifyNewMessage:', error);
        }
    }
}

module.exports = new ChatNotificationService();
