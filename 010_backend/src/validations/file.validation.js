const { z } = require('zod');

/**
 * File Validation Schemas
 */

// Upload file metadata
const uploadFileSchema = {
    body: z.object({
        visibility: z.enum(['all', 'admin', 'register'], {
            errorMap: () => ({ message: 'Ungültige Sichtbarkeit' }),
        }).default('all'),
        targetRegisterId: z
            .string()
            .regex(/^\d+$/, 'Ungültige Register-ID')
            .transform(Number)
            .optional()
            .nullable(),
        eventId: z
            .string()
            .regex(/^\d+$/, 'Ungültige Event-ID')
            .transform(Number)
            .optional()
            .nullable(),
        folder: z.string().default('/'),
        accessRules: z.union([
            z.string().transform((str, ctx) => {
                try {
                    return JSON.parse(str);
                } catch (e) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
                    return z.NEVER;
                }
            }),
            z.array(z.object({
                accessType: z.enum(['ALLOW', 'DENY']),
                targetType: z.enum(['USER', 'REGISTER']),
                userId: z.number().optional(),
                registerId: z.number().optional()
            }))
        ]).optional(),
    }),
};

// Get file by ID
const getFileByIdSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Datei-ID'),
    }),
};

// Query files
const queryFilesSchema = {
    query: z.object({
        visibility: z.enum(['all', 'admin', 'register']).optional(),
        eventId: z.string().regex(/^\d+$/).optional(),
        registerId: z.string().regex(/^\d+$/).optional(),
        folder: z.string().optional(),
    }),
};

// Allowed MIME types for upload
const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Audio (for sheet music recordings)
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
];

module.exports = {
    uploadFileSchema,
    getFileByIdSchema,
    queryFilesSchema,
    allowedMimeTypes,
};
