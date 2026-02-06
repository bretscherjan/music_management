const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middlewares/errorHandler.middleware');
const fileTokenService = require('./fileToken.service');

const prisma = new PrismaClient();

class OnlyOfficeService {
    constructor() {
        this.secret = process.env.ONLYOFFICE_SECRET;
        this.callbackHost = process.env.ONLYOFFICE_CALLBACK_HOST;
        this.documentServerUrl = process.env.ONLYOFFICE_DOCUMENT_SERVER;
    }

    /**
     * Generate editor configuration for a file
     */
    async getEditorConfig(fileId, user, userAgent) {
        const file = await prisma.file.findUnique({
            where: { id: parseInt(fileId) }
        });

        if (!file) {
            throw new AppError('Datei nicht gefunden', 404);
        }

        if (!this.secret) {
            throw new AppError('Server configuration error: ONLYOFFICE_SECRET is missing', 500);
        }

        if (!this.documentServerUrl) {
            throw new AppError('Server configuration error: ONLYOFFICE_DOCUMENT_SERVER is missing', 500);
        }

        // Generate a download token/url for the document
        // This URL is used by OnlyOffice (server) to download the file from our backend
        // We use the internal Docker DNS if needed, or the public URL if loopback is supported.
        // The user mentioned "Server address for internal requests from the Document Editing Service: https://argos.letsbuild.ch/"
        // So OnlyOffice will treat 'https://argos.letsbuild.ch/...' as the download URL.
        const downloadToken = await fileTokenService.generateToken(file.id, user.id);
        const downloadUrl = `${this.callbackHost}/api/public/files/${downloadToken}`;

        const fileExt = path.extname(file.originalName).replace('.', '').toLowerCase();

        // Define document type
        let documentType = 'word'; // Default for text documents
        if (['xls', 'xlsx', 'csv', 'ods', 'fods'].includes(fileExt)) documentType = 'cell';
        if (['ppt', 'pptx', 'odp', 'fodp', 'ppsx', 'pps'].includes(fileExt)) documentType = 'slide';
        if (['pdf', 'djvu', 'xps'].includes(fileExt)) documentType = 'pdf';

        console.log(`[OnlyOfficeService] Generated config for file ${fileId}:`);
        console.log(`   - OriginalName: ${file.originalName}`);
        console.log(`   - Extension: ${fileExt}`);
        console.log(`   - DocumentType: ${documentType}`);
        console.log(`   - DownloadUrl: ${downloadUrl}`);
        console.log(`   - DocumentServerUrl: ${this.documentServerUrl}`);

        // Callback URL - where OnlyOffice sends updates
        // Uses /api/files/onlyoffice/callback to piggyback on existing API route prefix that is definitely proxied
        const callbackUrl = `${this.callbackHost}/api/files/onlyoffice/callback?fileId=${file.id}`;

        const config = {
            document: {
                fileType: fileExt,
                key: `${file.id}-${file.createdAt.getTime()}-${file.size}`,
                title: file.originalName,
                url: downloadUrl,
                permissions: {
                    download: true,
                    edit: true, // Check user permissions here if needed
                    print: true,
                }
            },
            documentType,
            editorConfig: {
                callbackUrl: callbackUrl,
                user: {
                    id: String(user.id),
                    name: `${user.firstName} ${user.lastName}`
                },
                customization: {
                    forcesave: true,
                },
                lang: "de",
            }
        };

        // Create the token.
        // According to OnlyOffice documentation, the token should contain the payload.
        // We sign the entire config object (or specific parts depending on "tokenInBody" setting).
        // Usually, we just put everything in the payload.
        const token = jwt.sign(config, this.secret, { expiresIn: '5m', algorithm: 'HS256' });

        return {
            ...config,
            token,
            documentServerUrl: this.documentServerUrl
        };
    }

    /**
     * Handle callback from OnlyOffice (Save file)
     */
    async handleCallback(fileId, body, authHeader) {
        // 1. Validate Token
        let token = body.token;
        if (!token && authHeader) {
            token = authHeader.replace('Bearer ', '');
        }

        if (!token) {
            console.error('OnlyOffice Callback: No token provided');
            throw new AppError('No token provided', 401);
        }

        try {
            jwt.verify(token, this.secret);
        } catch (err) {
            console.error('OnlyOffice Callback: Invalid token', err.message);
            throw new AppError('Invalid token', 403);
        }

        // 2. Check Status
        const status = body.status;

        // Status 2 = Ready for saving, 6 = Force save
        if (status === 2 || status === 6) {
            const downloadUrl = body.url;
            if (!downloadUrl) {
                return { error: 0 };
            }

            console.log(`OnlyOffice: Saving file ${fileId} from ${downloadUrl}`);

            try {
                await this.downloadAndSaveFile(fileId, downloadUrl);
            } catch (err) {
                console.error('OnlyOffice: Failed to save file', err);
                // Return { error: 1 } to OnlyOffice to indicate failure
                return { error: 1 };
            }
        }

        // Need to return { error: 0 } to acknowledge
        return { error: 0 };
    }

    async downloadAndSaveFile(fileId, url) {
        const fileRecord = await prisma.file.findUnique({
            where: { id: parseInt(fileId) }
        });

        if (!fileRecord) throw new Error('File record not found');

        const filePath = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', fileRecord.filename);

        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(filePath);

            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download file: ${response.statusCode}`));
                    return;
                }

                response.pipe(fileStream);

                fileStream.on('finish', async () => {
                    fileStream.close();

                    // Update file stats in DB
                    try {
                        const stats = fs.statSync(filePath);
                        await prisma.file.update({
                            where: { id: fileRecord.id },
                            data: {
                                size: stats.size,
                                updatedAt: new Date()
                            }
                        });
                        console.log(`OnlyOffice: File ${fileId} updated successfully`);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => { }); // Delete partial file
                reject(err);
            });
        });
    }
}

module.exports = new OnlyOfficeService();
