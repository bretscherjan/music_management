const { z } = require('zod');

/**
 * Sheet Music Validation Schemas
 */

// Create sheet music
const createSheetMusicSchema = {
    body: z.object({
        title: z
            .string({ required_error: 'Titel ist erforderlich' })
            .min(1, 'Titel ist erforderlich')
            .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
        composer: z
            .string()
            .max(200, 'Komponist darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        arranger: z
            .string()
            .max(200, 'Arrangeur darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        genre: z
            .string()
            .max(100, 'Genre darf maximal 100 Zeichen lang sein')
            .optional()
            .nullable(),
        difficulty: z
            .enum(['easy', 'medium', 'hard'], {
                errorMap: () => ({ message: 'Ungültiger Schwierigkeitsgrad' }),
            })
            .optional()
            .nullable(),
        publisher: z
            .string()
            .max(200, 'Verlag/Quelle darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        notes: z
            .string()
            .max(5000, 'Notizen dürfen maximal 5000 Zeichen lang sein')
            .optional()
            .nullable(),
    }),
};

// Update sheet music
const updateSheetMusicSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige ID'),
    }),
    body: z.object({
        title: z
            .string()
            .min(1, 'Titel ist erforderlich')
            .max(200, 'Titel darf maximal 200 Zeichen lang sein')
            .optional(),
        composer: z
            .string()
            .max(200, 'Komponist darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        arranger: z
            .string()
            .max(200, 'Arrangeur darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        genre: z
            .string()
            .max(100, 'Genre darf maximal 100 Zeichen lang sein')
            .optional()
            .nullable(),
        difficulty: z
            .enum(['easy', 'medium', 'hard'])
            .optional()
            .nullable(),
        publisher: z
            .string()
            .max(200, 'Verlag/Quelle darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        notes: z
            .string()
            .max(5000, 'Notizen dürfen maximal 5000 Zeichen lang sein')
            .optional()
            .nullable(),
    }),
};

// Get sheet music by ID
const getSheetMusicByIdSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige ID'),
    }),
};

// Delete sheet music
const deleteSheetMusicSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige ID'),
    }),
};

// Query sheet music
const querySheetMusicSchema = {
    query: z.object({
        search: z.string().optional(),
        genre: z.string().optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
        bookmarkedBy: z.string().regex(/^\d+$/, 'Ungültige Benutzer-ID').optional(),
        sort: z
            .enum(['title', 'composer', 'arranger', 'genre', 'difficulty', 'createdAt'])
            .optional()
            .default('title'),
        page: z.string().regex(/^\d+$/, 'Ungültige Seitenzahl').optional().default('1'),
        limit: z.string().regex(/^\d+$/, 'Ungültiges Limit').optional().default('50'),
    }),
};

// Import CSV
const importCsvSchema = {
    body: z.object({
        mode: z.enum(['add', 'update'], {
            errorMap: () => ({ message: 'Ungültiger Modus (add oder update)' }),
        }),
        data: z.string({ required_error: 'CSV-Daten sind erforderlich' }),
    }),
};

// Toggle bookmark
const toggleBookmarkSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige ID'),
    }),
};

module.exports = {
    createSheetMusicSchema,
    updateSheetMusicSchema,
    getSheetMusicByIdSchema,
    deleteSheetMusicSchema,
    querySheetMusicSchema,
    importCsvSchema,
    toggleBookmarkSchema,
};
