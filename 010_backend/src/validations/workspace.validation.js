const { z } = require('zod');

// ============================================
// CATEGORY VALIDATIONS
// ============================================

const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Kategorie-Name ist erforderlich').max(100),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiges Farbformat').optional(),
        position: z.number().int().min(0).optional(),
    }),
});

const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Kategorie-ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiges Farbformat').nullable().optional(),
        position: z.number().int().min(0).optional(),
    }),
});

const deleteCategorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Kategorie-ID'),
    }),
});

// ============================================
// TASK VALIDATIONS
// ============================================

const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Task-Titel ist erforderlich').max(500),
        description: z.string().max(10000).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
        dueDate: z.string().datetime().optional().nullable(),
        categoryId: z.number().int().positive('Ungültige Kategorie-ID').optional(),
        parentId: z.number().int().positive().optional().nullable(),
        eventId: z.number().int().positive().optional().nullable(),
        position: z.number().int().min(0).optional(),
    }),
});

const updateTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Task-ID'),
    }),
    body: z.object({
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(10000).nullable().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        dueDate: z.string().datetime().nullable().optional(),
        categoryId: z.number().int().positive().optional(),
        parentId: z.number().int().positive().nullable().optional(),
        eventId: z.number().int().positive().nullable().optional(),
        position: z.number().int().min(0).optional(),
    }),
});

const completeTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Task-ID'),
    }),
    body: z.object({
        completed: z.boolean(),
    }),
});

const archiveTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Task-ID'),
    }),
    body: z.object({
        archived: z.boolean(),
    }),
});

const deleteTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Task-ID'),
    }),
});

const reorderTasksSchema = z.object({
    body: z.object({
        tasks: z.array(z.object({
            id: z.number().int().positive(),
            position: z.number().int().min(0),
            categoryId: z.number().int().positive().optional(),
            parentId: z.number().int().positive().nullable().optional(),
        })).min(1),
    }),
});

const getTaskHistorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Task-ID'),
    }),
});

// ============================================
// NOTE VALIDATIONS
// ============================================

const createNoteSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Notiz-Titel ist erforderlich').max(200),
        content: z.string().max(100000).optional().default(''),
        pinned: z.boolean().optional().default(false),
        position: z.number().int().min(0).optional(),
    }),
});

const updateNoteSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Notiz-ID'),
    }),
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        content: z.string().max(100000).optional(),
        pinned: z.boolean().optional(),
        position: z.number().int().min(0).optional(),
    }),
});

const deleteNoteSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Notiz-ID'),
    }),
});

const pinNoteSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Notiz-ID'),
    }),
    body: z.object({
        pinned: z.boolean(),
    }),
});

// ============================================
// SEARCH VALIDATIONS
// ============================================

const searchSchema = z.object({
    query: z.object({
        q: z.string().min(1, 'Suchbegriff ist erforderlich').max(200),
        type: z.enum(['tasks', 'notes', 'all']).optional().default('all'),
    }),
});

// ============================================
// EXPORT VALIDATIONS
// ============================================

const exportPdfSchema = z.object({
    query: z.object({
        type: z.enum(['tasks', 'notes', 'history', 'all']).optional().default('all'),
        categoryId: z.string().regex(/^\d+$/).optional(),
        includeArchived: z.string().optional().transform(val => val === 'true'),
    }),
});

const reorderCategoriesSchema = z.object({
    body: z.object({
        categories: z.array(z.object({
            id: z.number().int().positive(),
            position: z.number().int().min(0),
        })).min(1),
    }),
});

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    deleteCategorySchema,
    createTaskSchema,
    updateTaskSchema,
    completeTaskSchema,
    archiveTaskSchema,
    deleteTaskSchema,
    reorderTasksSchema,
    getTaskHistorySchema,
    createNoteSchema,
    updateNoteSchema,
    deleteNoteSchema,
    pinNoteSchema,
    searchSchema,
    exportPdfSchema,
    reorderCategoriesSchema,
};
