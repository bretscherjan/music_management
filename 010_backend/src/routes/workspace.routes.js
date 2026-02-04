const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
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
} = require('../validations/workspace.validation');

// All workspace routes require admin authentication
router.use(authMiddleware);
router.use(adminOnly);

// ============================================
// CATEGORY ROUTES
// ============================================

/**
 * @route   GET /api/workspace/categories
 * @desc    Get all task categories
 * @access  Admin
 */
router.get('/categories', workspaceController.getCategories);

/**
 * @route   POST /api/workspace/categories
 * @desc    Create a new category
 * @access  Admin
 */
router.post('/categories', validate(createCategorySchema), workspaceController.createCategory);

/**
 * @route   PUT /api/workspace/categories/:id
 * @desc    Update a category
 * @access  Admin
 */
router.put('/categories/:id', validate(updateCategorySchema), workspaceController.updateCategory);

/**
 * @route   DELETE /api/workspace/categories/:id
 * @desc    Delete a category
 * @access  Admin
 */
router.delete('/categories/:id', validate(deleteCategorySchema), workspaceController.deleteCategory);

/**
 * @route   PUT /api/workspace/categories/reorder
 * @desc    Reorder categories (drag & drop)
 * @access  Admin
 */
router.put('/categories/reorder', validate(reorderCategoriesSchema), workspaceController.reorderCategories);

// ============================================
// TASK ROUTES
// ============================================

/**
 * @route   GET /api/workspace/tasks
 * @desc    Get all tasks (with optional filters)
 * @access  Admin
 */
router.get('/tasks', workspaceController.getTasks);

/**
 * @route   POST /api/workspace/tasks
 * @desc    Create a new task
 * @access  Admin
 */
router.post('/tasks', validate(createTaskSchema), workspaceController.createTask);

/**
 * @route   PUT /api/workspace/tasks/reorder
 * @desc    Reorder tasks (drag & drop)
 * @access  Admin
 */
router.put('/tasks/reorder', validate(reorderTasksSchema), workspaceController.reorderTasks);

/**
 * @route   PUT /api/workspace/tasks/:id
 * @desc    Update a task
 * @access  Admin
 */
router.put('/tasks/:id', validate(updateTaskSchema), workspaceController.updateTask);

/**
 * @route   PUT /api/workspace/tasks/:id/complete
 * @desc    Complete or uncomplete a task
 * @access  Admin
 */
router.put('/tasks/:id/complete', validate(completeTaskSchema), workspaceController.completeTask);

/**
 * @route   PUT /api/workspace/tasks/:id/archive
 * @desc    Archive or unarchive a task
 * @access  Admin
 */
router.put('/tasks/:id/archive', validate(archiveTaskSchema), workspaceController.archiveTask);

/**
 * @route   DELETE /api/workspace/tasks/:id
 * @desc    Delete a task
 * @access  Admin
 */
router.delete('/tasks/:id', validate(deleteTaskSchema), workspaceController.deleteTask);

/**
 * @route   GET /api/workspace/tasks/:id/history
 * @desc    Get task history
 * @access  Admin
 */
router.get('/tasks/:id/history', validate(getTaskHistorySchema), workspaceController.getTaskHistory);

// ============================================
// NOTE ROUTES
// ============================================

/**
 * @route   GET /api/workspace/notes
 * @desc    Get all notes
 * @access  Admin
 */
router.get('/notes', workspaceController.getNotes);

/**
 * @route   POST /api/workspace/notes
 * @desc    Create a new note
 * @access  Admin
 */
router.post('/notes', validate(createNoteSchema), workspaceController.createNote);

/**
 * @route   PUT /api/workspace/notes/:id
 * @desc    Update a note
 * @access  Admin
 */
router.put('/notes/:id', validate(updateNoteSchema), workspaceController.updateNote);

/**
 * @route   DELETE /api/workspace/notes/:id
 * @desc    Delete a note
 * @access  Admin
 */
router.delete('/notes/:id', validate(deleteNoteSchema), workspaceController.deleteNote);

/**
 * @route   PUT /api/workspace/notes/:id/pin
 * @desc    Pin or unpin a note
 * @access  Admin
 */
router.put('/notes/:id/pin', validate(pinNoteSchema), workspaceController.pinNote);

// ============================================
// SEARCH & EXPORT ROUTES
// ============================================

/**
 * @route   GET /api/workspace/search
 * @desc    Search across tasks and notes
 * @access  Admin
 */
router.get('/search', validate(searchSchema), workspaceController.searchWorkspace);

/**
 * @route   GET /api/workspace/export/pdf
 * @desc    Export workspace data as PDF
 * @access  Admin
 */
router.get('/export/pdf', validate(exportPdfSchema), workspaceController.exportPdf);

/**
 * @route   GET /api/workspace/stats
 * @desc    Get workspace statistics
 * @access  Admin
 */
router.get('/stats', workspaceController.getStats);

module.exports = router;
