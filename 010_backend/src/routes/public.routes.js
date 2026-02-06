const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const fileTokenService = require('../services/fileToken.service');

// Initialize Prisma directly here if needed or rely on service
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

/**
 * @route   GET /api/public/files/:token
 * @desc    Stream file content using a one-time token
 * @access  Public (Token protected)
 */
router.get('/files/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;
    console.log(`[PublicRoute] Request received for token: ${token.substring(0, 10)}...`);

    try {
        const file = await fileTokenService.consumeToken(token);
        console.log(`[PublicRoute] File retrieved from token service: ${file.originalName}, Path: ${file.path}`);

        // Check if file exists on disk
        if (!file.path || !fs.existsSync(file.path)) {
            console.error(`[PublicRoute] File NOT found on disk: ${file.path}`);
            throw new AppError('Datei nicht auf dem Server gefunden', 404);
        }

        // Set headers for INLINE viewing (critical for Office Viewer)
        res.setHeader('Content-Type', file.mimetype);

        // For inline viewing, we generally want just 'inline', but filenames help browsers
        // Use 'inline' instead of 'attachment'
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);

        res.setHeader('Content-Length', file.size);
        console.log(`[PublicRoute] Sending file stream... Size: ${file.size}`);

        // Stream file
        const fileStream = fs.createReadStream(file.path);

        fileStream.on('error', (err) => {
            console.error(`[PublicRoute] Stream Error:`, err);
        });

        fileStream.pipe(res);
        console.log(`[PublicRoute] Stream pipe set up.`);

    } catch (error) {
        console.error(`[PublicRoute] Error processing download:`, error);
        // If it's an AppError, we can just throw it
        if (error instanceof AppError) {
            throw error;
        }
        // Otherwise wrap it
        throw new AppError(error.message || 'Fehler beim Abrufen der Datei', 500);
    }
}));

module.exports = router;
