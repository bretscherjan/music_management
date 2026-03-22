const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const chatStorage = require('./chat-storage.service');
const chatNotification = require('./chat-notification.service');

/**
 * Chat Service
 * Core business logic for managing chats and messages.
 */
class ChatService {
    /**
     * Create a direct chat between two users
     */
    async createDirectChat(userId, targetUserId) {
        if (userId === targetUserId) {
            throw new Error('You cannot start a chat with yourself');
        }

        // Check if direct chat already exists
        const existingChat = await prisma.chat.findFirst({
            where: {
                type: 'direct',
                AND: [
                    { participants: { some: { userId: userId } } },
                    { participants: { some: { userId: targetUserId } } }
                ]
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                profilePicture: true
                            }
                        }
                    }
                }
            }
        });

        if (existingChat) return existingChat;

        // Create new direct chat
        return await prisma.$transaction(async (tx) => {
            const chat = await tx.chat.create({
                data: {
                    type: 'direct',
                    createdBy: userId,
                    participants: {
                        create: [
                            { userId: userId, role: 'member' },
                            { userId: targetUserId, role: 'member' }
                        ]
                    },
                    readStates: {
                        create: [
                            { userId: userId },
                            { userId: targetUserId }
                        ]
                    }
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    profilePicture: true
                                }
                            }
                        }
                    }
                }
            });

            await chatStorage.ensureChatDirs(chat.id);
            return chat;
        });
    }

    /**
     * Create a group chat
     */
    async createGroupChat(userId, title, memberIds = []) {
        return await prisma.$transaction(async (tx) => {
            const chat = await tx.chat.create({
                data: {
                    type: 'group',
                    title: title || 'New Group',
                    createdBy: userId,
                    participants: {
                        create: [
                            { userId: userId, role: 'owner', canManageMembers: true },
                            ...memberIds.filter(id => id !== userId).map(id => ({
                                userId: id,
                                role: 'member'
                            }))
                        ]
                    },
                    readStates: {
                        create: [
                            { userId: userId },
                            ...memberIds.filter(id => id !== userId).map(id => ({
                                userId: id
                            }))
                        ]
                    }
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    profilePicture: true
                                }
                            }
                        }
                    }
                }
            });

            await chatStorage.ensureChatDirs(chat.id);
            return chat;
        });
    }

    /**
     * Send a message to a chat
     */
    async sendMessage(chatId, senderId, messageData) {
        const { text, type = 'text', metadata = {} } = messageData;

        // Verify participation
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: { chatId, userId: senderId }
            }
        });

        if (!participant) {
            throw new Error('Not a participant in this chat');
        }

        // 1. Store in Filesystem
        const { message, messageKey, segment } = await chatStorage.saveMessage(chatId, {
            senderId,
            text,
            type,
            ...metadata
        });

        // 2. Index in MySQL
        const messageIndex = await prisma.chatMessageIndex.create({
            data: {
                chatId,
                senderId,
                fileSegment: segment,
                messageKey: messageKey,
                searchableText: text.substring(0, 1000), // Cap for indexing
                hasLinks: !!metadata.links,
                hasMentions: !!metadata.mentions
            }
        });

        // 3. Update Chat Metadata
        await prisma.chat.update({
            where: { id: chatId },
            data: {
                lastMessageAt: new Date(),
                lastMessagePreview: text.substring(0, 100).trim() + (text.length > 100 ? '...' : '')
            }
        });

        // 4. Update Read States for others
        await prisma.chatReadState.updateMany({
            where: {
                chatId,
                userId: { not: senderId }
            },
            data: {
                unreadCount: { increment: 1 }
            }
        });

        // 5. Notify participants
        const fullMessage = {
            ...message,
            indexId: messageIndex.id
        };
        
        // Non-blocking notification
        chatNotification.notifyNewMessage(chatId, senderId, fullMessage).catch(err => {
            console.error('Failed to send chat notifications:', err);
        });

        return fullMessage;
    }

    /**
     * Get list of chats for a user
     */
    async getChatsForUser(userId) {
        return await prisma.chat.findMany({
            where: {
                participants: { some: { userId } }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                profilePicture: true
                            }
                        }
                    }
                },
                readStates: {
                    where: { userId }
                }
            },
            orderBy: {
                lastMessageAt: 'desc'
            }
        });
    }

    /**
     * Get messages for a chat
     */
    async getChatMessages(chatId, userId, limit = 50, cursor = null) {
        // Verify participation
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: { chatId, userId }
            }
        });

        if (!participant) {
            throw new Error('Not a participant in this chat');
        }

        // Fetch from MySQL index first to know which files to read
        const messageIndices = await prisma.chatMessageIndex.findMany({
            where: { chatId },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'desc' }
        });

        if (messageIndices.length === 0) return [];

        // Group by segments to minimize reads
        const segments = [...new Set(messageIndices.map(m => m.fileSegment))];
        
        // Read messages from each required segment
        const messageStore = {};
        for (const segment of segments) {
            const msgs = await chatStorage.readMessages(chatId, segment);
            msgs.forEach(m => {
                messageStore[m.id] = m;
            });
        }

        // Map indices back to full messages
        return messageIndices.map(idx => ({
            ...messageStore[idx.messageKey],
            indexId: idx.id,
            createdAt: idx.createdAt,
            editedAt: idx.editedAt,
            deletedAt: idx.deletedAt
        })).reverse(); // Return in chronological order
    }

    /**
     * Mark chat as read
     */
    async markChatAsRead(chatId, userId) {
        const lastMessage = await prisma.chatMessageIndex.findFirst({
            where: { chatId },
            orderBy: { id: 'desc' }
        });

        return await prisma.chatReadState.update({
            where: {
                chatId_userId: { chatId, userId }
            },
            data: {
                unreadCount: 0,
                lastReadSequence: lastMessage ? lastMessage.id : 0
            }
        });
    }

    /**
     * Toggle a reaction on a message
     */
    async toggleReaction(chatId, userId, messageId, emoji) {
        // 1. Find message index to get the segment
        const messageIndex = await prisma.chatMessageIndex.findFirst({
            where: { chatId, messageKey: messageId }
        });

        if (!messageIndex) throw new Error('Message not found');

        // 2. Read messages from segment
        const messages = await chatStorage.readMessages(chatId, messageIndex.fileSegment);
        const message = messages.find(m => m.id === messageId);
        if (!message) throw new Error('Message not found in storage');

        // 3. Update reactions
        if (!message.reactions) message.reactions = [];
        
        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
            if (existingReaction.userIds.includes(userId)) {
                existingReaction.userIds = existingReaction.userIds.filter(id => id !== userId);
                if (existingReaction.userIds.length === 0) {
                    message.reactions = message.reactions.filter(r => r.emoji !== emoji);
                }
            } else {
                existingReaction.userIds.push(userId);
            }
        } else {
            message.reactions.push({ emoji, userIds: [userId] });
        }

        // 4. Update file
        await chatStorage.updateMessageInFile(chatId, messageIndex.fileSegment, messageId, { reactions: message.reactions });

        return message;
    }

    /**
     * Update chat metadata (title)
     */
    async updateChat(chatId, userId, data) {
        // Check if user is owner or admin
        const participant = await prisma.chatParticipant.findUnique({
            where: { chatId_userId: { chatId, userId } }
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!participant || (participant.role !== 'owner' && user.role !== 'admin')) {
            throw new Error('Not authorized to update this chat');
        }

        return await prisma.chat.update({
            where: { id: chatId },
            data: {
                title: data.title,
                updatedAt: new Date()
            }
        });
    }

    /**
     * Delete a chat
     */
    async deleteChat(chatId, userId) {
        // Check if user is owner or admin
        const participant = await prisma.chatParticipant.findUnique({
            where: { chatId_userId: { chatId, userId } }
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!participant || (participant.role !== 'owner' && user.role !== 'admin')) {
            throw new Error('Not authorized to delete this chat');
        }

        // We could do a soft delete or hard delete. For now, hard delete.
        await prisma.chat.delete({
            where: { id: chatId }
        });

        // Optionally cleanup filesystem, but maybe keep for audit/backup.
    }

    /**
     * Add participants to a group chat
     */
    async addParticipants(chatId, userId, newUserIds) {
        const participant = await prisma.chatParticipant.findUnique({
            where: { chatId_userId: { chatId, userId } }
        });

        if (!participant || !participant.canManageMembers) {
            throw new Error('Not authorized to manage members');
        }

        return await prisma.$transaction(async (tx) => {
            await tx.chatParticipant.createMany({
                data: newUserIds.map(id => ({
                    chatId,
                    userId: id,
                    role: 'member'
                })),
                skipDuplicates: true
            });

            await tx.chatReadState.createMany({
                data: newUserIds.map(id => ({
                    chatId,
                    userId: id
                })),
                skipDuplicates: true
            });

            return await tx.chat.findUnique({
                where: { id: chatId },
                include: { participants: { include: { user: true } } }
            });
        });
    }

    /**
     * Remove participant from group chat
     */
    async removeParticipant(chatId, userId, targetUserId) {
        const participant = await prisma.chatParticipant.findUnique({
            where: { chatId_userId: { chatId, userId } }
        });

        if (!participant || !participant.canManageMembers) {
            if (userId !== targetUserId) {
                throw new Error('Not authorized to remove members');
            }
        }

        await prisma.chatParticipant.delete({
            where: { chatId_userId: { chatId, userId: targetUserId } }
        });
    }

    /**
     * Search for entities to link in chat
     */
    async searchEntities(query, type = null) {
        const limit = 10;
        const searchTerm = query || '';

        const queries = [];

        if (!type || type === 'user') {
            queries.push(prisma.user.findMany({
                where: searchTerm ? {
                    OR: [
                        { firstName: { contains: searchTerm } },
                        { lastName: { contains: searchTerm } }
                    ],
                    status: 'active'
                } : { status: 'active' },
                select: { id: true, firstName: true, lastName: true },
                take: limit,
                orderBy: { lastName: 'asc' }
            }).then(res => res.map(u => ({ id: u.id, type: 'user', label: `${u.firstName} ${u.lastName}` }))));
        }

        if (!type || type === 'event') {
            queries.push(prisma.event.findMany({
                where: searchTerm ? { title: { contains: searchTerm } } : {},
                select: { id: true, title: true },
                take: limit,
                orderBy: { date: 'desc' }
            }).then(res => res.map(e => ({ id: e.id, type: 'event', label: e.title }))));
        }

        if (!type || type === 'file') {
            queries.push(prisma.file.findMany({
                where: searchTerm ? { originalName: { contains: searchTerm } } : {},
                select: { id: true, originalName: true },
                take: limit,
                orderBy: { createdAt: 'desc' }
            }).then(res => res.map(f => ({ id: f.id, type: 'file', label: f.originalName }))));
        }

        if (!type || type === 'folder') {
            queries.push(prisma.folder.findMany({
                where: searchTerm ? { name: { contains: searchTerm } } : {},
                select: { id: true, name: true },
                take: limit,
                orderBy: { name: 'asc' }
            }).then(res => res.map(fo => ({ id: fo.id, type: 'folder', label: fo.name }))));
        }

        const results = await Promise.all(queries);
        return results.flat();
    }
}

module.exports = new ChatService();
