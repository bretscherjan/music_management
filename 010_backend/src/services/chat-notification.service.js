const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pushService = require('./push.service');
const websocketService = require('./websocket.service');

/**
 * Chat Notification Service
 * Handles sending push notifications and other alerts for chat messages.
 */
class ChatNotificationService {
    /**
     * Notify participants of a new message
     */
    async notifyNewMessage(chatId, senderId, message) {
        try {
            const chat = await prisma.chat.findUnique({
                where: { id: chatId },
                include: {
                    participants: {
                        where: { userId: { not: senderId } },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    notificationSettings: true
                                }
                            }
                        }
                    }
                }
            });

            if (!chat) return;

            const sender = await prisma.user.findUnique({
                where: { id: senderId },
                select: { firstName: true, lastName: true }
            });

            const chatTitle = chat.type === 'group' 
                ? chat.title 
                : `${sender.firstName} ${sender.lastName}`;

            // Get list of online users to avoid spamming people who are already looking at the chat
            const onlineUsers = websocketService.getOnlineUsersList();
            const onlineUserIds = new Set(onlineUsers.map(u => u.id));

            for (const participant of chat.participants) {
                const targetUserId = participant.userId;

                // Skip if user is muted (logic to be added to ChatParticipant later)
                if (participant.muted) continue;

                // Push Notification
                // We send it if user is NOT online or if they are online but maybe not in the specific chat
                // The frontend can handle not showing a push if the user is already in the chat.
                // But for now, we just send it if they are not active in the workspace or as a general rule.
                
                await pushService.sendPushToUser(targetUserId, {
                    title: chat.type === 'group' ? `${chatTitle}` : 'Neue Nachricht',
                    body: chat.type === 'group' 
                        ? `${sender.firstName}: ${message.text.substring(0, 50)}`
                        : `${sender.firstName}: ${message.text.substring(0, 50)}`,
                    icon: '/logos/logo_on_white.svg',
                    badge: '/logos/logo_on_white.svg',
                    data: {
                        type: 'chat_message',
                        chatId: chatId,
                        url: `/member/chat/${chatId}`
                    }
                });
            }
        } catch (error) {
            console.error('Error in notifyNewMessage:', error);
        }
    }
}

module.exports = new ChatNotificationService();
