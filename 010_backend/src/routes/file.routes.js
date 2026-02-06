const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
const onlyOfficeController = require('../controllers/onlyoffice.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
    getFileByIdSchema,
    queryFilesSchema,
} = require('../validations/file.validation');

/**
 * @route   POST /api/files/upload
 * @desc    Upload a file
 * @access  Private (authenticated users, admin for visibility settings)
 */
router.post(
    '/upload',
    authMiddleware,
    fileController.upload.single('file'),
    fileController.uploadFile
);



/**
 * @route   GET /api/files
 * @desc    Get all files (filtered by user permissions)
 * @access  Private
 */
router.get('/', authMiddleware, validate(queryFilesSchema), fileController.getAllFiles);

/**
 * @route   POST /api/files/onlyoffice/callback
 * @desc    Callback from OnlyOffice
 */
router.post('/onlyoffice/callback', onlyOfficeController.callback);

/**
 * @route   GET /api/files/:id/onlyoffice/config
 * @desc    Get editor config
 */
router.get('/:id/onlyoffice/config', authMiddleware, onlyOfficeController.getEditorConfig);



/**
 * @route   GET /api/files/:id
 * @desc    Download file (protected)
 * @access  Private (based on visibility)
 */
router.get('/:id', authMiddleware, validate(getFileByIdSchema), fileController.getFileById);

/**
 * @route   GET /api/files/:id/info
 * @desc    Get file metadata
 * @access  Private (based on visibility)
 */
router.get('/:id/info', authMiddleware, validate(getFileByIdSchema), fileController.getFileInfo);

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete file
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, validate(getFileByIdSchema), fileController.deleteFile);

/**
 * @route   PUT /api/files/:id/access
 * @desc    Update file access permissions
 * @access  Admin only
 */
router.put('/:id/access', authMiddleware, adminOnly, fileController.updateFileAccess);

/**
 * @route   POST /api/files/:id/view-token
 * @desc    Generate a one-time public view token
 * @access  Private (based on visibility)
 */
router.post('/:id/view-token', authMiddleware, validate(getFileByIdSchema), fileController.generateViewToken);

module.exports = router;
