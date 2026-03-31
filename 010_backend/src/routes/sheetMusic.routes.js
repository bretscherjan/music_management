const express = require('express');
const router = express.Router();

const sheetMusicController = require('../controllers/sheetMusic.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
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

const { auditMiddleware } = require('../middlewares/auditLog.middleware');

/**
 * @route   GET /api/sheet-music
 * @desc    Get all sheet music with search, filter, sort, pagination
 * @access  Private (authenticated users)
 */
router.get('/', authMiddleware, permissionCheck('sheetMusic:read'), validate(querySheetMusicSchema), sheetMusicController.getAllSheetMusic);

/**
 * @route   GET /api/sheet-music/export-csv
 * @desc    Export sheet music to CSV (with filters)
 * @access  Private (authenticated users)
 */
router.get('/export-csv', authMiddleware, permissionCheck('sheetMusic:read'), sheetMusicController.exportCsv);

/**
 * @route   GET /api/sheet-music/export-pdf
 * @desc    Export sheet music to PDF (with filters)
 * @access  Private (authenticated users)
 */
router.get('/export-pdf', authMiddleware, permissionCheck('sheetMusic:read'), sheetMusicController.exportPdf);

/**
 * @route   GET /api/sheet-music/:id
 * @desc    Get sheet music by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', authMiddleware, permissionCheck('sheetMusic:read'), validate(getSheetMusicByIdSchema), sheetMusicController.getSheetMusicById);

/**
 * @route   GET /api/sheet-music/:id/view
 * @desc    Stream Sheet Music PDF (Part/Score)
 * @access  Private (authenticated users)
 */
router.get('/:id/view', authMiddleware, permissionCheck('sheetMusic:read'), auditMiddleware('SHEET_MUSIC_VIEW', 'SheetMusic', req => req.params.id), sheetMusicController.viewSheetMusicPdf);

/**
 * @route   POST /api/sheet-music
 * @desc    Create new sheet music
 * @access  Admin only
 */
router.post('/', authMiddleware, permissionCheck('sheetMusic:manage'), validate(createSheetMusicSchema), sheetMusicController.createSheetMusic);

/**
 * @route   POST /api/sheet-music/import-csv
 * @desc    Import sheet music from CSV
 * @access  Admin only
 */
router.post('/import-csv', authMiddleware, permissionCheck('sheetMusic:manage'), validate(importCsvSchema), sheetMusicController.importCsv);

/**
 * @route   POST /api/sheet-music/:id/bookmark
 * @desc    Toggle bookmark for sheet music
 * @access  Admin only
 */
router.post('/:id/bookmark', authMiddleware, permissionCheck('sheetMusic:write'), validate(toggleBookmarkSchema), sheetMusicController.toggleBookmark);

/**
 * @route   PUT /api/sheet-music/:id
 * @desc    Update sheet music
 * @access  Admin only
 */
router.put('/:id', authMiddleware, permissionCheck('sheetMusic:manage'), validate(updateSheetMusicSchema), sheetMusicController.updateSheetMusic);

/**
 * @route   DELETE /api/sheet-music/:id
 * @desc    Delete sheet music
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, permissionCheck('sheetMusic:manage'), validate(deleteSheetMusicSchema), sheetMusicController.deleteSheetMusic);

module.exports = router;
