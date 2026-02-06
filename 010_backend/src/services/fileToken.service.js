const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

// Token validity duration in minutes
const TOKEN_VALIDITY_MINUTES = 10;
// Maximum number of times a token can be used (OnlyOffice may make HEAD + GET + retries)
const MAX_TOKEN_USES = 5;

class FileTokenService {
    /**
     * Generate a limited-use token for a file
     * @param {number} fileId 
     * @param {number} userId - User requesting the token (for audit if needed)
     * @returns {Promise<string>} The generated token
     */
    async generateToken(fileId, userId) {
        console.log(`[FileToken] Generating token for fileId: ${fileId}, userId: ${userId}`);
        // Generate a random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_VALIDITY_MINUTES * 60 * 1000);

        console.log(`[FileToken] Token created: ${token.substring(0, 10)}..., Expires: ${expiresAt.toISOString()}`);

        await prisma.fileShareToken.create({
            data: {
                token,
                fileId,
                expiresAt,
                usageCount: 0
            }
        });

        console.log(`[FileToken] Token saved to DB successfully.`);
        return token;
    }

    /**
     * Consume a token and return the file path
     * @param {string} token 
     * @returns {Promise<object>} The file object
     */
    async consumeToken(token) {
        console.log(`[FileToken] Consuming token: ${token.substring(0, 10)}...`);

        const tokenRecord = await prisma.fileShareToken.findUnique({
            where: { token },
            include: { file: true }
        });

        if (!tokenRecord) {
            console.error(`[FileToken] Token NOT found in DB: ${token}`);
            throw new AppError('Ungültiger Token', 404);
        }

        console.log(`[FileToken] Token found. FileId: ${tokenRecord.fileId}, UsageCount: ${tokenRecord.usageCount}/${MAX_TOKEN_USES}, Expires: ${tokenRecord.expiresAt.toISOString()}`);

        // Check if token usage limit is reached
        if (tokenRecord.usageCount >= MAX_TOKEN_USES) {
            console.error(`[FileToken] Token usage limit reached (${MAX_TOKEN_USES})`);
            throw new AppError('Token-Nutzungslimit erreicht', 410);
        }

        if (tokenRecord.expiresAt < new Date()) {
            console.error(`[FileToken] Token expired.`);
            throw new AppError('Dieser Link ist abgelaufen', 410);
        }

        // Increment usage counter
        await prisma.fileShareToken.update({
            where: { id: tokenRecord.id },
            data: { usageCount: { increment: 1 } }
        });

        console.log(`[FileToken] Token validation successful. Usage: ${tokenRecord.usageCount + 1}/${MAX_TOKEN_USES}. Returning file: ${tokenRecord.file.originalName}`);
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
