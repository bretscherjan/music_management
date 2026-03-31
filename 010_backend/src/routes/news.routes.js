const express = require('express');
const router = express.Router();
const { z } = require('zod');

const newsController = require('../controllers/news.controller');
const { authMiddleware, optionalAuth } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
const { validate } = require('../middlewares/validate.middleware');

// Validation schemas
const createNewsSchema = {
    body: z.object({
        title: z
            .string({ required_error: 'Titel ist erforderlich' })
            .min(1, 'Titel ist erforderlich')
            .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
        content: z
            .string({ required_error: 'Inhalt ist erforderlich' })
            .min(1, 'Inhalt ist erforderlich'),
    }),
};

const updateNewsSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige News-ID'),
    }),
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
    }),
};

const getNewsByIdSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige News-ID'),
    }),
};

const queryNewsSchema = {
    query: z.object({
        limit: z.string().regex(/^\d+$/).optional(),
        offset: z.string().regex(/^\d+$/).optional(),
    }),
};

/**
 * @route   GET /api/news
 * @desc    Get all news
 * @access  Public
 */
router.get('/', validate(queryNewsSchema), newsController.getAllNews);

/**
 * @route   GET /api/news/:id
 * @desc    Get news by ID
 * @access  Public
 */
router.get('/:id', validate(getNewsByIdSchema), newsController.getNewsById);

/**
 * @route   POST /api/news
 * @desc    Create news
 * @access  Admin only
 */
router.post('/', authMiddleware, permissionCheck('news:write'), validate(createNewsSchema), newsController.createNews);

/**
 * @route   PUT /api/news/:id
 * @desc    Update news
 * @access  Admin only
 */
router.put('/:id', authMiddleware, permissionCheck('news:write'), validate(updateNewsSchema), newsController.updateNews);

/**
 * @route   DELETE /api/news/:id
 * @desc    Delete news
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, permissionCheck('news:write'), validate(getNewsByIdSchema), newsController.deleteNews);

module.exports = router;
