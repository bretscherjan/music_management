const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const PdfPrinter = require('pdfmake/js/Printer').default;
const path = require('path');

const prisma = new PrismaClient();

// ============================================
// CATEGORY CONTROLLERS
// ============================================

/**
 * Get all task categories
 * GET /workspace/categories
 */
const getCategories = asyncHandler(async (req, res) => {
    const categories = await prisma.taskCategory.findMany({
        orderBy: { position: 'asc' },
        include: {
            _count: {
                select: { tasks: true }
            }
        }
    });

    res.json({ categories });
});

/**
 * Create a new category
 * POST /workspace/categories
 */
const createCategory = asyncHandler(async (req, res) => {
    const { name, color, position } = req.body;

    // Get highest position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
        const lastCategory = await prisma.taskCategory.findFirst({
            orderBy: { position: 'desc' }
        });
        finalPosition = lastCategory ? lastCategory.position + 1 : 0;
    }

    const category = await prisma.taskCategory.create({
        data: {
            name,
            color,
            position: finalPosition,
        }
    });

    // Emit socket event for real-time sync
    if (req.io) {
        req.io.to('workspace').emit('category:created', category);
    }

    res.status(201).json({
        message: 'Kategorie erstellt',
        category
    });
});

/**
 * Update a category
 * PUT /workspace/categories/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, color, position } = req.body;

    const category = await prisma.taskCategory.update({
        where: { id: parseInt(id) },
        data: {
            ...(name !== undefined && { name }),
            ...(color !== undefined && { color }),
            ...(position !== undefined && { position }),
        }
    });

    if (req.io) {
        req.io.to('workspace').emit('category:updated', category);
    }

    res.json({
        message: 'Kategorie aktualisiert',
        category
    });
});

/**
 * Delete a category
 * DELETE /workspace/categories/:id
 */
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.taskCategory.delete({
        where: { id: parseInt(id) }
    });

    if (req.io) {
        req.io.to('workspace').emit('category:deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Kategorie gelöscht' });
});

// ============================================
// TASK CONTROLLERS
// ============================================

/**
 * Reorder categories
 * PUT /workspace/categories/reorder
 */
const reorderCategories = asyncHandler(async (req, res) => {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
        res.status(400);
        throw new Error('Ungültige Daten: categories Array erwartet');
    }

    console.log('Reordering categories:', categories);

    // Update all categories in a transaction
    try {
        await prisma.$transaction(
            categories.map(({ id, position }) =>
                prisma.taskCategory.update({
                    where: { id: parseInt(id) },
                    data: { position: parseInt(position) }
                })
            )
        );
    } catch (error) {
        console.error('Reorder transaction failed:', error);
        res.status(500).json({
            message: 'Fehler beim Speichern der Reihenfolge',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        return;
    }

    if (req.io) {
        req.io.to('workspace').emit('categories:reordered', categories);
    }

    res.json({ message: 'Kategorien neu geordnet' });
});

// ============================================
// TASK CONTROLLERS
// ============================================

/**
 * Get all tasks (optionally filtered)
 * GET /workspace/tasks
 */
const getTasks = asyncHandler(async (req, res) => {
    const { categoryId, includeArchived, includeCompleted, parentId } = req.query;

    const whereClause = {
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(includeArchived !== 'true' && { archived: false }),
        ...(includeCompleted !== 'true' && { completed: false }),
        ...(parentId === 'null' ? { parentId: null } : parentId && { parentId: parseInt(parentId) }),
    };

    const tasks = await prisma.task.findMany({
        where: whereClause,
        orderBy: { position: 'asc' },
        include: {
            category: true,
            createdBy: {
                select: { id: true, firstName: true, lastName: true }
            },
            completedBy: {
                select: { id: true, firstName: true, lastName: true }
            },
            event: {
                select: { id: true, title: true, date: true }
            },
            subtasks: {
                orderBy: { position: 'asc' },
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    completedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            },
            _count: {
                select: { subtasks: true }
            }
        }
    });

    res.json({ tasks });
});

/**
 * Create a new task
 * POST /workspace/tasks
 */
const createTask = asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, categoryId, parentId, eventId, position } = req.body;
    const userId = req.user.id;

    // Get or create default category if not provided
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
        let defaultCategory = await prisma.taskCategory.findFirst({
            where: { name: 'Allgemein' }
        });
        if (!defaultCategory) {
            defaultCategory = await prisma.taskCategory.create({
                data: { name: 'Allgemein', position: 0 }
            });
        }
        finalCategoryId = defaultCategory.id;
    }

    // Get highest position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
        const lastTask = await prisma.task.findFirst({
            where: { categoryId: finalCategoryId, parentId: parentId || null },
            orderBy: { position: 'desc' }
        });
        finalPosition = lastTask ? lastTask.position + 1 : 0;
    }

    const task = await prisma.task.create({
        data: {
            title,
            description,
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            categoryId: finalCategoryId,
            parentId: parentId || null,
            eventId: eventId || null,
            position: finalPosition,
            createdById: userId,
        },
        include: {
            category: true,
            createdBy: {
                select: { id: true, firstName: true, lastName: true }
            },
            event: {
                select: { id: true, title: true, date: true }
            }
        }
    });

    // Create history entry
    await prisma.taskHistory.create({
        data: {
            taskId: task.id,
            userId,
            action: 'created',
            details: { title }
        }
    });

    if (req.io) {
        req.io.to('workspace').emit('task:created', task);
    }

    res.status(201).json({
        message: 'Task erstellt',
        task
    });
});

/**
 * Update a task
 * PUT /workspace/tasks/:id
 */
const updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, dueDate, categoryId, parentId, eventId, position } = req.body;
    const userId = req.user.id;

    const oldTask = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!oldTask) {
        throw new AppError('Task nicht gefunden', 404);
    }

    const task = await prisma.task.update({
        where: { id: parseInt(id) },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(priority !== undefined && { priority }),
            ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
            ...(categoryId !== undefined && { categoryId }),
            ...(parentId !== undefined && { parentId }),
            ...(eventId !== undefined && { eventId }),
            ...(position !== undefined && { position }),
        },
        include: {
            category: true,
            createdBy: {
                select: { id: true, firstName: true, lastName: true }
            },
            completedBy: {
                select: { id: true, firstName: true, lastName: true }
            },
            event: {
                select: { id: true, title: true, date: true }
            },
            subtasks: {
                orderBy: { position: 'asc' }
            }
        }
    });

    // Create history entry
    await prisma.taskHistory.create({
        data: {
            taskId: task.id,
            userId,
            action: 'edited',
            details: {
                changes: {
                    ...(title !== undefined && title !== oldTask.title && { title: { old: oldTask.title, new: title } }),
                    ...(priority !== undefined && priority !== oldTask.priority && { priority: { old: oldTask.priority, new: priority } }),
                }
            }
        }
    });

    if (req.io) {
        req.io.to('workspace').emit('task:updated', task);
    }

    res.json({
        message: 'Task aktualisiert',
        task
    });
});

/**
 * Complete/uncomplete a task
 * PUT /workspace/tasks/:id/complete
 */
const completeTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    const userId = req.user.id;

    const task = await prisma.task.update({
        where: { id: parseInt(id) },
        data: {
            completed,
            completedAt: completed ? new Date() : null,
            completedById: completed ? userId : null,
        },
        include: {
            category: true,
            createdBy: {
                select: { id: true, firstName: true, lastName: true }
            },
            completedBy: {
                select: { id: true, firstName: true, lastName: true }
            }
        }
    });

    // Create history entry
    await prisma.taskHistory.create({
        data: {
            taskId: task.id,
            userId,
            action: completed ? 'completed' : 'uncompleted',
        }
    });

    if (req.io) {
        req.io.to('workspace').emit('task:completed', task);
    }

    res.json({
        message: completed ? 'Task erledigt' : 'Task wieder geöffnet',
        task
    });
});

/**
 * Archive/unarchive a task
 * PUT /workspace/tasks/:id/archive
 */
const archiveTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { archived } = req.body;
    const userId = req.user.id;

    const task = await prisma.task.update({
        where: { id: parseInt(id) },
        data: { archived }
    });

    await prisma.taskHistory.create({
        data: {
            taskId: task.id,
            userId,
            action: archived ? 'archived' : 'unarchived',
        }
    });

    if (req.io) {
        req.io.to('workspace').emit('task:archived', { id: task.id, archived });
    }

    res.json({
        message: archived ? 'Task archiviert' : 'Task wiederhergestellt',
        task
    });
});

/**
 * Delete a task
 * DELETE /workspace/tasks/:id
 */
const deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.task.delete({
        where: { id: parseInt(id) }
    });

    if (req.io) {
        req.io.to('workspace').emit('task:deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Task gelöscht' });
});

/**
 * Reorder tasks (for drag & drop)
 * PUT /workspace/tasks/reorder
 */
const reorderTasks = asyncHandler(async (req, res) => {
    const { tasks } = req.body;

    // Update all tasks in a transaction
    await prisma.$transaction(
        tasks.map(({ id, position, categoryId, parentId }) =>
            prisma.task.update({
                where: { id },
                data: {
                    position,
                    ...(categoryId !== undefined && { categoryId }),
                    ...(parentId !== undefined && { parentId }),
                }
            })
        )
    );

    if (req.io) {
        req.io.to('workspace').emit('tasks:reordered', tasks);
    }

    res.json({ message: 'Tasks neu geordnet' });
});

/**
 * Get task history
 * GET /workspace/tasks/:id/history
 */
const getTaskHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const history = await prisma.taskHistory.findMany({
        where: { taskId: parseInt(id) },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true }
            }
        }
    });

    res.json({ history });
});

// ============================================
// NOTE CONTROLLERS
// ============================================

/**
 * Get all notes
 * GET /workspace/notes
 */
const getNotes = asyncHandler(async (req, res) => {
    const notes = await prisma.adminNote.findMany({
        orderBy: [
            { pinned: 'desc' },
            { position: 'asc' }
        ],
        include: {
            owner: {
                select: { id: true, firstName: true, lastName: true }
            },
            contributions: {
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            }
        }
    });

    // Calculate primary contributor for each note
    const notesWithPrimaryContributor = notes.map(note => {
        let primaryContributorId = note.ownerId;
        if (note.contributions.length > 0) {
            const sorted = [...note.contributions].sort((a, b) => b.charCount - a.charCount);
            primaryContributorId = sorted[0].userId;
        }
        return {
            ...note,
            primaryContributorId
        };
    });

    res.json({ notes: notesWithPrimaryContributor });
});

/**
 * Create a new note
 * POST /workspace/notes
 */
const createNote = asyncHandler(async (req, res) => {
    const { title, content, pinned, position } = req.body;
    const userId = req.user.id;

    // Get highest position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
        const lastNote = await prisma.adminNote.findFirst({
            orderBy: { position: 'desc' }
        });
        finalPosition = lastNote ? lastNote.position + 1 : 0;
    }

    const note = await prisma.adminNote.create({
        data: {
            title,
            content: content || '',
            pinned: pinned || false,
            position: finalPosition,
            ownerId: userId,
        },
        include: {
            owner: {
                select: { id: true, firstName: true, lastName: true }
            }
        }
    });

    // Create initial contribution
    if (content && content.length > 0) {
        await prisma.noteContribution.create({
            data: {
                noteId: note.id,
                userId,
                charCount: content.length
            }
        });
    }

    if (req.io) {
        req.io.to('workspace').emit('note:created', note);
    }

    res.status(201).json({
        message: 'Notiz erstellt',
        note
    });
});

/**
 * Update a note
 * PUT /workspace/notes/:id
 */
const updateNote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, content, pinned, position } = req.body;
    const userId = req.user.id;

    const oldNote = await prisma.adminNote.findUnique({ where: { id: parseInt(id) } });
    if (!oldNote) {
        throw new AppError('Notiz nicht gefunden', 404);
    }

    const note = await prisma.adminNote.update({
        where: { id: parseInt(id) },
        data: {
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
            ...(pinned !== undefined && { pinned }),
            ...(position !== undefined && { position }),
        },
        include: {
            owner: {
                select: { id: true, firstName: true, lastName: true }
            }
        }
    });

    // Update contribution tracking
    if (content !== undefined && content !== oldNote.content) {
        const charDiff = content.length - oldNote.content.length;
        if (charDiff > 0) {
            // User added characters
            await prisma.noteContribution.upsert({
                where: {
                    noteId_userId: { noteId: note.id, userId }
                },
                update: {
                    charCount: { increment: charDiff }
                },
                create: {
                    noteId: note.id,
                    userId,
                    charCount: charDiff
                }
            });
        }
    }

    if (req.io) {
        req.io.to('workspace').emit('note:updated', { id: note.id, title: note.title, pinned: note.pinned, userId });
    }

    res.json({
        message: 'Notiz aktualisiert',
        note
    });
});

/**
 * Delete a note
 * DELETE /workspace/notes/:id
 */
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.adminNote.delete({
        where: { id: parseInt(id) }
    });

    if (req.io) {
        req.io.to('workspace').emit('note:deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Notiz gelöscht' });
});

/**
 * Pin/unpin a note
 * PUT /workspace/notes/:id/pin
 */
const pinNote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { pinned } = req.body;

    const note = await prisma.adminNote.update({
        where: { id: parseInt(id) },
        data: { pinned }
    });

    if (req.io) {
        req.io.to('workspace').emit('note:pinned', { id: note.id, pinned });
    }

    res.json({
        message: pinned ? 'Notiz angepinnt' : 'Notiz losgelöst',
        note
    });
});

// ============================================
// SEARCH CONTROLLER
// ============================================

/**
 * Search across tasks and notes
 * GET /workspace/search
 */
const searchWorkspace = asyncHandler(async (req, res) => {
    const { q, type = 'all' } = req.query;

    const results = {
        tasks: [],
        notes: []
    };

    if (type === 'all' || type === 'tasks') {
        results.tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { title: { contains: q } },
                    { description: { contains: q } }
                ]
            },
            include: {
                category: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            take: 20
        });
    }

    if (type === 'all' || type === 'notes') {
        results.notes = await prisma.adminNote.findMany({
            where: {
                OR: [
                    { title: { contains: q } },
                    { content: { contains: q } }
                ]
            },
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            take: 20
        });
    }

    res.json({ results });
});

// ============================================
// EXPORT CONTROLLER
// ============================================

/**
 * Export workspace data as PDF
 * GET /workspace/export/pdf
 */
const exportPdf = asyncHandler(async (req, res) => {
    const { type = 'all', categoryId, includeArchived } = req.query;

    // Fetch data based on type
    let tasks = [];
    let notes = [];
    let history = [];

    if (type === 'all' || type === 'tasks') {
        const whereClause = {
            ...(categoryId && { categoryId: parseInt(categoryId) }),
            ...(includeArchived !== true && { archived: false })
        };

        tasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: [
                { categoryId: 'asc' },
                { position: 'asc' }
            ],
            include: {
                category: true,
                createdBy: {
                    select: { firstName: true, lastName: true }
                },
                completedBy: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }

    if (type === 'all' || type === 'notes') {
        notes = await prisma.adminNote.findMany({
            orderBy: { position: 'asc' },
            include: {
                owner: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }

    if (type === 'all' || type === 'history') {
        history = await prisma.taskHistory.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                task: {
                    select: { title: true }
                },
                user: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }

    // Build PDF
    const fontPath = path.join(process.cwd(), 'src/fonts');
    console.log('PDF Export: checking fonts in', fontPath);

    // Validate fonts exist
    const requiredFonts = ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Italic.ttf', 'Roboto-MediumItalic.ttf'];
    // Need to import 'fs' module for fs.existsSync
    const fs = require('fs');
    const missingFonts = requiredFonts.filter(f => !fs.existsSync(path.join(fontPath, f)));

    if (missingFonts.length > 0) {
        console.error('PDF Export Error: Missing fonts:', missingFonts);
        // Fallback to standard fonts or throw clear error
        // For now, let's try to proceed but log heavily, maybe fail gracefully
        return res.status(500).json({ message: 'Server configuration error: Fonts missing', details: missingFonts });
    }

    const fonts = {
        Roboto: {
            normal: path.join(fontPath, 'Roboto-Regular.ttf'),
            bold: path.join(fontPath, 'Roboto-Medium.ttf'),
            italics: path.join(fontPath, 'Roboto-Italic.ttf'),
            bolditalics: path.join(fontPath, 'Roboto-MediumItalic.ttf')
        }
    };

    const printer = new PdfPrinter(fonts);

    const content = [];

    // Header
    content.push({
        text: 'Admin Workspace Export',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 10]
    });

    content.push({
        text: new Date().toLocaleDateString('de-CH') + ' ' + new Date().toLocaleTimeString('de-CH'),
        alignment: 'right',
        margin: [0, 0, 0, 20]
    });

    // Tasks Section
    if (tasks.length > 0) {
        content.push({ text: 'Tasks', style: 'subheader', margin: [0, 10, 0, 10] });

        const taskRows = tasks.map(task => [
            task.completed ? '☑' : '☐',
            task.title,
            task.category?.name || '-',
            task.priority,
            task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '-',
            task.completedBy ? `${task.completedBy.firstName} ${task.completedBy.lastName}` : '-',
        ]);

        content.push({
            table: {
                headerRows: 1,
                widths: [20, '*', 'auto', 'auto', 'auto', 'auto'],
                body: [
                    [
                        { text: '', style: 'tableHeader' },
                        { text: 'Titel', style: 'tableHeader' },
                        { text: 'Kategorie', style: 'tableHeader' },
                        { text: 'Priorität', style: 'tableHeader' },
                        { text: 'Erstellt von', style: 'tableHeader' },
                        { text: 'Erledigt von', style: 'tableHeader' },
                    ],
                    ...taskRows
                ]
            }
        });
    }

    // Notes Section
    if (notes.length > 0) {
        content.push({ text: 'Notizen', style: 'subheader', margin: [0, 20, 0, 10] });

        notes.forEach(note => {
            content.push({
                text: note.title + (note.pinned ? ' 📌' : ''),
                style: 'noteTitle',
                margin: [0, 5, 0, 2]
            });
            content.push({
                text: `Von: ${note.owner.firstName} ${note.owner.lastName}`,
                fontSize: 9,
                color: 'gray',
                margin: [0, 0, 0, 5]
            });
            content.push({
                text: note.content.substring(0, 500) + (note.content.length > 500 ? '...' : ''),
                margin: [0, 0, 0, 10]
            });
        });
    }

    // History Section
    if (history.length > 0) {
        content.push({ text: 'Verlauf (letzte 100 Einträge)', style: 'subheader', margin: [0, 20, 0, 10] });

        const historyRows = history.map(h => [
            new Date(h.createdAt).toLocaleDateString('de-CH'),
            h.task?.title || '-',
            h.action,
            `${h.user.firstName} ${h.user.lastName}`
        ]);

        content.push({
            table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto'],
                body: [
                    [
                        { text: 'Datum', style: 'tableHeader' },
                        { text: 'Task', style: 'tableHeader' },
                        { text: 'Aktion', style: 'tableHeader' },
                        { text: 'Benutzer', style: 'tableHeader' },
                    ],
                    ...historyRows
                ]
            }
        });
    }

    const docDefinition = {
        pageOrientation: 'portrait',
        content,
        styles: {
            header: { fontSize: 18, bold: true },
            subheader: { fontSize: 14, bold: true },
            noteTitle: { fontSize: 12, bold: true },
            tableHeader: { bold: true, fontSize: 10, fillColor: '#eeeeee' }
        },
        defaultStyle: { fontSize: 10 }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=workspace-export.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end();
});

// ============================================
// STATS CONTROLLER
// ============================================

/**
 * Get workspace statistics
 * GET /workspace/stats
 */
const getStats = asyncHandler(async (req, res) => {
    const [
        totalTasks,
        completedTasks,
        archivedTasks,
        totalNotes,
        tasksByCategory,
        recentActivity
    ] = await Promise.all([
        prisma.task.count({ where: { archived: false } }),
        prisma.task.count({ where: { completed: true, archived: false } }),
        prisma.task.count({ where: { archived: true } }),
        prisma.adminNote.count(),
        prisma.taskCategory.findMany({
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        }),
        prisma.taskHistory.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                task: { select: { title: true } },
                user: { select: { id: true, firstName: true, lastName: true } }
            }
        })
    ]);

    res.json({
        stats: {
            totalTasks,
            completedTasks,
            archivedTasks,
            totalNotes,
            tasksByCategory: tasksByCategory.map(c => ({
                id: c.id,
                name: c.name,
                count: c._count.tasks
            })),
            recentActivity
        }
    });
});

module.exports = {
    // Categories
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    // Tasks
    getTasks,
    createTask,
    updateTask,
    completeTask,
    archiveTask,
    deleteTask,
    reorderTasks,
    getTaskHistory,
    // Notes
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    pinNote,
    // Search & Export
    searchWorkspace,
    exportPdf,
    getStats,
};
