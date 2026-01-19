const { z } = require('zod');

/**
 * Event Validation Schemas
 */

// Time format validation (HH:mm)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Create event
const createEventSchema = {
    body: z.object({
        title: z
            .string({ required_error: 'Titel ist erforderlich' })
            .min(1, 'Titel ist erforderlich')
            .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
        description: z
            .string()
            .max(5000, 'Beschreibung darf maximal 5000 Zeichen lang sein')
            .optional()
            .nullable(),
        location: z
            .string()
            .max(200, 'Ort darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        category: z.enum(['rehearsal', 'performance', 'other'], {
            errorMap: () => ({ message: 'Ungültige Kategorie' }),
        }),
        visibility: z.enum(['all', 'register', 'admin'], {
            errorMap: () => ({ message: 'Ungültige Sichtbarkeit' }),
        }),
        date: z
            .string({ required_error: 'Datum ist erforderlich' })
            .refine((val) => !isNaN(Date.parse(val)), 'Ungültiges Datum'),
        startTime: z
            .string({ required_error: 'Startzeit ist erforderlich' })
            .regex(timeRegex, 'Ungültiges Zeitformat (HH:mm erwartet)'),
        endTime: z
            .string({ required_error: 'Endzeit ist erforderlich' })
            .regex(timeRegex, 'Ungültiges Zeitformat (HH:mm erwartet)'),
        isRecurring: z.boolean().default(false),
        recurrenceRule: z
            .string()
            .max(500, 'Wiederholungsregel darf maximal 500 Zeichen lang sein')
            .optional()
            .nullable(),
        excludedDates: z
            .array(z.string())
            .optional()
            .nullable(),
        defaultAttendanceStatus: z.enum(['yes', 'no', 'maybe', 'none'], {
            errorMap: () => ({ message: 'Ungültiger Standard-Anwesenheitsstatus' }),
        }).optional().default('none'),
        responseDeadlineHours: z
            .number({ required_error: 'Rückmeldefrist ist erforderlich' })
            .int()
            .min(0, 'Rückmeldefrist muss mindestens 0 Stunden sein')
            .max(720, 'Rückmeldefrist darf maximal 720 Stunden (30 Tage) sein')
            .default(48),
        setlistEnabled: z.boolean().default(false),
    }).refine(
        (data) => {
            // Validate that endTime is after startTime
            const [startHour, startMin] = data.startTime.split(':').map(Number);
            const [endHour, endMin] = data.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            return endMinutes > startMinutes;
        },
        { message: 'Endzeit muss nach Startzeit liegen', path: ['endTime'] }
    ).refine(
        (data) => {
            // If isRecurring is true, recurrenceRule must be provided
            if (data.isRecurring && !data.recurrenceRule) {
                return false;
            }
            return true;
        },
        { message: 'Wiederholungsregel ist erforderlich für Serientermine', path: ['recurrenceRule'] }
    ),
};

// Update event
const updateEventSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Event-ID'),
    }),
    body: z.object({
        title: z
            .string()
            .min(1, 'Titel ist erforderlich')
            .max(200, 'Titel darf maximal 200 Zeichen lang sein')
            .optional(),
        description: z
            .string()
            .max(5000, 'Beschreibung darf maximal 5000 Zeichen lang sein')
            .optional()
            .nullable(),
        location: z
            .string()
            .max(200, 'Ort darf maximal 200 Zeichen lang sein')
            .optional()
            .nullable(),
        category: z.enum(['rehearsal', 'performance', 'other']).optional(),
        visibility: z.enum(['all', 'register', 'admin']).optional(),
        date: z
            .string()
            .refine((val) => !isNaN(Date.parse(val)), 'Ungültiges Datum')
            .optional(),
        startTime: z
            .string()
            .regex(timeRegex, 'Ungültiges Zeitformat (HH:mm erwartet)')
            .optional(),
        endTime: z
            .string()
            .regex(timeRegex, 'Ungültiges Zeitformat (HH:mm erwartet)')
            .optional(),
        isRecurring: z.boolean().optional(),
        recurrenceRule: z.string().max(500).optional().nullable(),
        excludedDates: z.array(z.string()).optional().nullable(),
        setlistEnabled: z.boolean().optional(),
        responseDeadlineHours: z
            .number()
            .int()
            .min(0)
            .max(720)
            .optional(),
    }),
};

// Set attendance
const setAttendanceSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Event-ID'),
    }),
    body: z.object({
        status: z.enum(['yes', 'no', 'maybe'], {
            errorMap: () => ({ message: 'Ungültiger Teilnahme-Status' }),
        }),
        comment: z
            .string()
            .max(500, 'Kommentar darf maximal 500 Zeichen lang sein')
            .optional()
            .nullable(),
        userId: z.number().int().optional(),
    }),
};

// Get event by ID
const getEventByIdSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Event-ID'),
    }),
};

// Query events
const queryEventsSchema = {
    query: z.object({
        startDate: z
            .string()
            .refine((val) => !isNaN(Date.parse(val)), 'Ungültiges Startdatum')
            .optional(),
        endDate: z
            .string()
            .refine((val) => !isNaN(Date.parse(val)), 'Ungültiges Enddatum')
            .optional(),
        category: z.enum(['rehearsal', 'performance', 'other']).optional(),
        expand: z.enum(['true', 'false']).optional(),
    }),
};

// Bulk delete events
const bulkDeleteSchema = {
    body: z.object({
        ids: z.array(z.number().int().positive(), {
            required_error: 'IDs sind erforderlich',
        }).min(1, 'Mindestens eine ID erforderlich'),
    }),
};

// Add item to setlist
const addSetlistItemSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Event-ID'),
    }),
    body: z.object({
        type: z.enum(['sheetMusic', 'pause', 'custom'], {
            errorMap: () => ({ message: 'Ungültiger Typ' }),
        }),
        sheetMusicId: z.number().int().positive().optional(),
        customTitle: z.string().max(200).optional(),
        customDescription: z.string().max(2000).optional(),
        duration: z.number().int().positive().optional(),
    }).refine(
        (data) => {
            if (data.type === 'sheetMusic') return !!data.sheetMusicId;
            if (data.type === 'pause' || data.type === 'custom') return !!data.customTitle;
            return false;
        },
        { message: 'Ungültige Element-Konfiguration' }
    ),
};

// Update setlist item
const updateSetlistItemSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Event-ID'),
        itemId: z.string().regex(/^\d+$/, 'Ungültige Element-ID'),
    }),
    body: z.object({
        customTitle: z.string().max(200).optional(),
        customDescription: z.string().max(2000).optional(),
        duration: z.number().int().positive().optional(),
    }),
};

// Remove item from setlist
const removeSetlistItemSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Event-ID'),
        itemId: z.string().regex(/^\d+$/, 'Ungültige Element-ID'),
    }),
};

// Reorder setlist
const reorderSetlistSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Event-ID'),
    }),
    body: z.object({
        items: z.array(
            z.object({
                id: z.number().int().positive(),
                position: z.number().int().min(0),
            })
        ).min(1, 'Mindestens ein Element erforderlich'),
    }),
};

module.exports = {
    createEventSchema,
    updateEventSchema,
    setAttendanceSchema,
    getEventByIdSchema,
    queryEventsSchema,
    bulkDeleteSchema,
    addSetlistItemSchema,
    updateSetlistItemSchema,
    removeSetlistItemSchema,
    reorderSetlistSchema,
};
