const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

// Token validity duration in minutes
const TOKEN_VALIDITY_MINUTES = 10;

class FileTokenService {
    /**
     * Generate a one-time use token for a file
     * @param {number} fileId 
     * @param {number} userId - User requesting the token (for audit if needed)
     * @returns {Promise<string>} The generated token
     */
    async generateToken(fileId, userId) {
        // Generate a random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_VALIDITY_MINUTES * 60 * 1000);

        await prisma.fileShareToken.create({
            data: {
                token,
                fileId,
                expiresAt,
                used: false
            }
        });

        return token;
    }

    /**
     * Consume a token and return the file path
     * @param {string} token 
     * @returns {Promise<object>} The file object
     */
    async consumeToken(token) {
        const tokenRecord = await prisma.fileShareToken.findUnique({
            where: { token },
            include: { file: true }
        });

        if (!tokenRecord) {
            throw new AppError('Ungültiger Token', 404);
        }

        if (tokenRecord.used) {
            throw new AppError('Dieser Link wurde bereits verwendet', 410); // 410 Gone
        }

        if (tokenRecord.expiresAt < new Date()) {
            throw new AppError('Dieser Link ist abgelaufen', 410);
        }

        // Mark as used (One-Time Token logic)
        await prisma.fileShareToken.update({
            where: { id: tokenRecord.id },
            data: { used: true }
        });

        return tokenRecord.file;
    }

    /**
     * Cleanup expired tokens
     */
    async cleanupExpiredTokens() {
        const result = await prisma.fileShareToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        console.log(`Deleted ${result.count} expired tokens`);
    }
}

module.exports = new FileTokenService();
