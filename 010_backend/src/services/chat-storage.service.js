const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const CHAT_DATA_DIR = path.join(__dirname, '../../chat-data');

/**
 * Chat Storage Service
 * Handles persisting messages to the filesystem as JSONL files.
 */
class ChatStorageService {
    /**
     * Get the directory path for a specific chat
     * @param {number} chatId 
     * @returns {string}
     */
    getChatDir(chatId) {
        return path.join(CHAT_DATA_DIR, 'chats', `chat_${chatId}`);
    }

    /**
     * Get the current active message file path for a chat
     * @param {number} chatId 
     * @returns {string}
     */
    getActiveMessageFile(chatId) {
        const now = new Date();
        const segment = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return path.join(this.getChatDir(chatId), 'messages', `${segment}.active.jsonl`);
    }

    /**
     * Ensure chat directory structure exists
     * @param {number} chatId 
     */
    async ensureChatDirs(chatId) {
        const chatDir = this.getChatDir(chatId);
        const messagesDir = path.join(chatDir, 'messages');
        const attachmentsDir = path.join(chatDir, 'attachments');

        await fs.mkdir(chatDir, { recursive: true });
        await fs.mkdir(messagesDir, { recursive: true });
        await fs.mkdir(attachmentsDir, { recursive: true });
    }

    /**
     * Save a new message to the filesystem
     * @param {number} chatId 
     * @param {object} messageData 
     * @returns {Promise<object>} The stored message with id and segment info
     */
    async saveMessage(chatId, messageData) {
        await this.ensureChatDirs(chatId);
        
        const messageKey = uuidv4();
        const now = new Date();
        const segment = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const message = {
            id: messageKey,
            ...messageData,
            createdAt: now.toISOString(),
            chatId
        };

        const filePath = this.getActiveMessageFile(chatId);
        await fs.appendFile(filePath, JSON.stringify(message) + '\n');

        return {
            message,
            messageKey,
            segment
        };
    }

    /**
     * Read messages from a specific segment
     * @param {number} chatId 
     * @param {string} segment e.g. "2026-03"
     * @returns {Promise<Array>}
     */
    async readMessages(chatId, segment) {
        const filePath = path.join(this.getChatDir(chatId), 'messages', `${segment}.active.jsonl`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return data.split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
        } catch (error) {
            if (error.code === 'ENOENT') return [];
            throw error;
        }
    }

    /**
     * Update an existing message (soft delete or edit)
     * For JSONL, this is slightly harder as we have to rewrite the file or use a separate index.
     * Given the hybrid approach, we'll probably rely on MySQL for status, 
     * but we can append an "update" record or rewrite the segment if it's small.
     * Simple approach: find line and replace (requires full read/write).
     */
    async updateMessageInFile(chatId, segment, messageKey, updateData) {
        const filePath = path.join(this.getChatDir(chatId), 'messages', `${segment}.active.jsonl`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const lines = data.split('\n').filter(line => line.trim());
            const updatedLines = lines.map(line => {
                const msg = JSON.parse(line);
                if (msg.id === messageKey) {
                    return JSON.stringify({ ...msg, ...updateData, editedAt: new Date().toISOString() });
                }
                return line;
            });
            await fs.writeFile(filePath, updatedLines.join('\n') + '\n');
        } catch (error) {
            if (error.code === 'ENOENT') return;
            throw error;
        }
    }

    /**
     * Delete all filesystem data for a chat
     * @param {number} chatId
     */
    async deleteChatData(chatId) {
        const chatDir = this.getChatDir(chatId);
        await fs.rm(chatDir, { recursive: true, force: true });
    }
}

// Since we need UUID which might not be installed, I'll use a simple fallback if needed.
// But package.json should have it. Wait, I didn't see uuid in package.json.
// I'll check package.json again.
module.exports = new ChatStorageService();
