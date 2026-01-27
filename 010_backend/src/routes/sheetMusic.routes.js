const express = require('express');
const router = express.Router();

const sheetMusicController = require('../controllers/sheetMusic.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
    createSheetMusicSchema,
    updateSheetMusicSchema,
    getSheetMusicByIdSchema,
    deleteSheetMusicSchema,
    querySheetMusicSchema,
    importCsvSchema,
    toggleBookmarkSchema,
} = require('../validations/sheetMusic.validation');

/**
 * @route   GET /api/sheet-music
 * @desc    Get all sheet music with search, filter, sort, pagination
 * @access  Private (authenticated users)
 */
router.get('/', authMiddleware, validate(querySheetMusicSchema), sheetMusicController.getAllSheetMusic);

/**
 * @route   GET /api/sheet-music/export-csv
 * @desc    Export sheet music to CSV (with filters)
 * @access  Admin only
 */
router.get('/export-csv', authMiddleware, adminOnly, sheetMusicController.exportCsv);

/**
 * @route   GET /api/sheet-music/export-pdf
 * @desc    Export sheet music to PDF (with filters)
 * @access  Admin only
 */
router.get('/export-pdf', authMiddleware, adminOnly, sheetMusicController.exportPdf);

/**
 * @route   GET /api/sheet-music/:id
 * @desc    Get sheet music by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', authMiddleware, validate(getSheetMusicByIdSchema), sheetMusicController.getSheetMusicById);

/**
 * @route   POST /api/sheet-music
 * @desc    Create new sheet music
 * @access  Admin only
 */
router.post('/', authMiddleware, adminOnly, validate(createSheetMusicSchema), sheetMusicController.createSheetMusic);

/**
 * @route   POST /api/sheet-music/import-csv
 * @desc    Import sheet music from CSV
 * @access  Admin only
 */
router.post('/import-csv', authMiddleware, adminOnly, validate(importCsvSchema), sheetMusicController.importCsv);

/**
 * @route   POST /api/sheet-music/:id/bookmark
 * @desc    Toggle bookmark for sheet music
 * @access  Admin only
 */
router.post('/:id/bookmark', authMiddleware, adminOnly, validate(toggleBookmarkSchema), sheetMusicController.toggleBookmark);

/**
 * @route   PUT /api/sheet-music/:id
 * @desc    Update sheet music
 * @access  Admin only
 */
router.put('/:id', authMiddleware, adminOnly, validate(updateSheetMusicSchema), sheetMusicController.updateSheetMusic);

/**
 * @route   DELETE /api/sheet-music/:id
 * @desc    Delete sheet music
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, validate(deleteSheetMusicSchema), sheetMusicController.deleteSheetMusic);

module.exports = router;
