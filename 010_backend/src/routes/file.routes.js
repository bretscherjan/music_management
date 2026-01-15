const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
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
 * @route   POST /api/files/create-folder
 * @desc    Create a new empty folder
 * @access  Private
 */
router.post('/create-folder', authMiddleware, fileController.createFolder);

/**
 * @route   GET /api/files
 * @desc    Get all files (filtered by user permissions)
 * @access  Private
 */
router.get('/', authMiddleware, validate(queryFilesSchema), fileController.getAllFiles);

/**
 * @route   GET /api/files/folders
 * @desc    Get all unique folders
 * @access  Private
 */
router.get('/folders', authMiddleware, fileController.getFolders);

/**
 * @route   DELETE /api/files/folders
 * @desc    Delete folder and contents
 * @access  Admin only
 */
router.delete('/folders', authMiddleware, adminOnly, fileController.deleteFolder);

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

module.exports = router;
