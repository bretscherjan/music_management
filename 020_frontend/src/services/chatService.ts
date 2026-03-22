import api from '@/lib/api';
import type { Chat, ChatMessage } from '@/types/chat';

const chatService = {
    /**
     * Get all chats for the current user
     */
    async getChats(): Promise<Chat[]> {
        const response = await api.get<Chat[]>('/chat');
        return response.data;
    },

    /**
     * Get messages for a specific chat
     */
    async getMessages(chatId: number, limit = 50, cursor?: number): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>(`/chat/${chatId}/messages`, {
            params: { limit, cursor }
        });
        return response.data;
    },

    /**
     * Create or get a direct chat
     */
    async createDirectChat(userId: number): Promise<Chat> {
        const response = await api.post<Chat>('/chat/direct', { userId });
        return response.data;
    },

    /**
     * Create a group chat
     */
    async createGroupChat(title: string, memberIds: number[]): Promise<Chat> {
        const response = await api.post<Chat>('/chat/group', { title, memberIds });
        return response.data;
    },

    /**
     * Send a message
     */
    async sendMessage(chatId: number, text: string, type = 'text', metadata = {}): Promise<ChatMessage> {
        const response = await api.post<ChatMessage>(`/chat/${chatId}/messages`, {
            text,
            type,
            metadata
        });
        return response.data;
    },

    /**
     * Mark chat as read
     */
    async markAsRead(chatId: number): Promise<void> {
        await api.post(`/chat/${chatId}/read`);
    },

    /**
     * Search users for new chat
     */
    async searchUsers(query: string): Promise<any[]> {
        const response = await api.get<any[]>('/chat/users/search', {
            params: { query }
        });
        return response.data;
    },

    /**
     * Search for entities to link (#)
     */
    async searchEntities(query: string, type?: string): Promise<any[]> {
        const response = await api.get<any[]>('/chat/search-entities', {
            params: { query, type }
        });
        return response.data;
    },

    /**
     * Toggle a reaction on a message
     */
    async toggleReaction(chatId: number, messageId: string, emoji: string): Promise<ChatMessage> {
        const response = await api.post<ChatMessage>(`/chat/${chatId}/messages/${messageId}/react`, { emoji });
        return response.data;
    },

    /**
     * Update chat metadata (title)
     */
    async updateChat(chatId: number, data: { title: string }): Promise<Chat> {
        const response = await api.patch<Chat>(`/chat/${chatId}`, data);
        return response.data;
    },

    /**
     * Delete a chat
     */
    async deleteChat(chatId: number): Promise<void> {
        await api.delete(`/chat/${chatId}`);
    },

    /**
     * Add participants to group
     */
    async addParticipants(chatId: number, userIds: number[]): Promise<Chat> {
        const response = await api.post<Chat>(`/chat/${chatId}/participants`, { userIds });
        return response.data;
    },

    /**
     * Remove participant from group
     */
    async removeParticipant(chatId: number, userId: number): Promise<void> {
        await api.delete(`/chat/${chatId}/participants/${userId}`);
    }
};

export default chatService;
