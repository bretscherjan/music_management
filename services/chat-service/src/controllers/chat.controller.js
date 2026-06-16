const chatService = require('../services/chat.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Chat Controller
 * Handles HTTP requests for chat features.
 */
class ChatController {
    /**
     * Get all chats for the current user
     */
    async getChats(req, res) {
        try {
            const chats = await chatService.getChatsForUser(req.user.id);
            res.json(chats);
        } catch (error) {
            console.error('Error fetching chats:', error);
            res.status(500).json({ error: 'Failed to fetch chats' });
        }
    }

    /**
     * Get messages for a specific chat
     */
    async getMessages(req, res) {
        try {
            const { chatId } = req.params;
            const { limit, cursor } = req.query;
            
            const messages = await chatService.getChatMessages(
                parseInt(chatId), 
                req.user.id, 
                limit ? parseInt(limit) : 50,
                cursor ? parseInt(cursor) : null
            );
            
            res.json(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch messages' });
        }
    }

    /**
     * Create or get a direct chat
     */
    async createDirectChat(req, res) {
        try {
            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({ error: 'Target userId is required' });
            }

            const chat = await chatService.createDirectChat(req.user.id, parseInt(userId));
            res.status(201).json(chat);
        } catch (error) {
            console.error('Error creating direct chat:', error);
            res.status(500).json({ error: error.message || 'Failed to create direct chat' });
        }
    }

    /**
     * Create a group chat
     */
    async createGroupChat(req, res) {
        try {
            const { title, memberIds } = req.body;
            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }

            const chat = await chatService.createGroupChat(req.user.id, title, memberIds || []);
            res.status(201).json(chat);
        } catch (error) {
            console.error('Error creating group chat:', error);
            res.status(500).json({ error: error.message || 'Failed to create group chat' });
        }
    }

    /**
     * Send a message
     */
    async sendMessage(req, res) {
        try {
            const { chatId } = req.params;
            const { text, type, metadata } = req.body;

            if (!text && type !== 'file') {
                return res.status(400).json({ error: 'Message text is required' });
            }

            const message = await chatService.sendMessage(parseInt(chatId), req.user.id, {
                text,
                type: type || 'text',
                metadata: metadata || {}
            });

            // Emit via socket if available
            if (req.io) {
                req.io.to(`chat:${chatId}`).emit('chat:message:created', message);
                // Notify all participants so their chat lists refresh
                const participants = await prisma.chatParticipant.findMany({
                    where: { chatId: parseInt(chatId) },
                    select: { userId: true }
                });
                for (const p of participants) {
                    req.io.to(`user:${p.userId}`).emit('chat:updated', { chatId: parseInt(chatId) });
                }
            }

            res.status(201).json(message);
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: error.message || 'Failed to send message' });
        }
    }

    /**
     * Mark chat as read
     */
    async markAsRead(req, res) {
        try {
            const { chatId } = req.params;
            await chatService.markChatAsRead(parseInt(chatId), req.user.id);
            res.status(204).end();
        } catch (error) {
            console.error('Error marking chat as read:', error);
            res.status(500).json({ error: 'Failed to mark chat as read' });
        }
    }

    /**
     * Search users for new chat
     */
    async searchUsers(req, res) {
        try {
            const { query } = req.query;
            if (!query || query.length < 2) {
                return res.json([]);
            }

            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query } },
                        { lastName: { contains: query } },
                        { email: { contains: query } }
                    ],
                    id: { not: req.user.id },
                    status: 'active'
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                    register: { select: { name: true } }
                },
                take: 10
            });

            res.json(users);
        } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ error: 'Failed to search users' });
        }
    }

    /**
     * Toggle reaction on a message
     */
    async toggleReaction(req, res) {
        try {
            const { chatId, messageId } = req.params;
            const { emoji } = req.body;

            const updatedMessage = await chatService.toggleReaction(
                parseInt(chatId),
                req.user.id,
                messageId,
                emoji
            );

            if (req.io) {
                req.io.to(`chat:${chatId}`).emit('chat:message:updated', updatedMessage);
            }

            res.json(updatedMessage);
        } catch (error) {
            console.error('Error toggling reaction:', error);
            res.status(500).json({ error: error.message || 'Failed to toggle reaction' });
        }
    }

    /**
     * Update chat metadata
     */
    async updateChat(req, res) {
        try {
            const { chatId } = req.params;
            const chat = await chatService.updateChat(parseInt(chatId), req.user.id, req.body);
            
            if (req.io) {
                req.io.to(`chat:${chatId}`).emit('chat:updated', chat);
            }
            
            res.json(chat);
        } catch (error) {
            console.error('Error updating chat:', error);
            res.status(500).json({ error: error.message || 'Failed to update chat' });
        }
    }

    /**
     * Delete a chat
     */
    async deleteChat(req, res) {
        try {
            const { chatId } = req.params;
            await chatService.deleteChat(parseInt(chatId), req.user.id);
            
            if (req.io) {
                req.io.to(`chat:${chatId}`).emit('chat:deleted', { chatId: parseInt(chatId) });
            }
            
            res.status(204).end();
        } catch (error) {
            console.error('Error deleting chat:', error);
            res.status(500).json({ error: error.message || 'Failed to delete chat' });
        }
    }

    /**
     * Add participants to group
     */
    async addParticipants(req, res) {
        try {
            const { chatId } = req.params;
            const { userIds } = req.body;
            const chat = await chatService.addParticipants(parseInt(chatId), req.user.id, userIds);
            
            if (req.io) {
                req.io.to(`chat:${chatId}`).emit('chat:updated', chat);
            }
            
            res.json(chat);
        } catch (error) {
            console.error('Error adding participants:', error);
            res.status(500).json({ error: error.message || 'Failed to add participants' });
        }
    }

    /**
     * Remove participant or leave chat
     */
    async removeParticipant(req, res) {
        try {
            const { chatId, userId } = req.params;
            await chatService.removeParticipant(parseInt(chatId), req.user.id, parseInt(userId));
            
            if (req.io) {
                req.io.to(`chat:${chatId}`).emit('chat:participant:removed', { chatId: parseInt(chatId), userId: parseInt(userId) });
            }
            
            res.status(204).end();
        } catch (error) {
            console.error('Error removing participant:', error);
            res.status(500).json({ error: error.message || 'Failed to remove participant' });
        }
    }

    /**
     * Search for entities to link
     */
    async searchEntities(req, res) {
        try {
            const { query, type } = req.query;
            const results = await chatService.searchEntities(query, type);
            res.json(results);
        } catch (error) {
            console.error('Error searching entities:', error);
            res.status(500).json({ error: 'Failed to search entities' });
        }
    }
}

module.exports = new ChatController();
