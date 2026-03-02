const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const {
    getAllMusicFolders,
    getMusicFolderById,
    createMusicFolder,
    updateMusicFolder,
    deleteMusicFolder,
    setFolderItems,
    addFolderItems,
    exportFolderZip,
    exportFolderPdf
} = require('../controllers/musicFolder.controller');

const { auditMiddleware } = require('../middlewares/auditLog.middleware');

// Public/Member Routes (Read-only + Export)
router.get('/', authMiddleware, getAllMusicFolders);
router.get('/:id', authMiddleware, auditMiddleware('MUSIC_FOLDER_OPEN', 'MusicFolder', req => req.params.id), getMusicFolderById);
router.get('/:id/export-zip', authMiddleware, auditMiddleware('MUSIC_FOLDER_ZIP_DOWNLOAD', 'MusicFolder', req => req.params.id), exportFolderZip);
router.get('/:id/export-pdf', authMiddleware, exportFolderPdf);

// Admin Routes (Management)
router.post('/', authMiddleware, adminOnly, createMusicFolder);
router.put('/:id', authMiddleware, adminOnly, updateMusicFolder);
router.post('/:id/items', authMiddleware, adminOnly, setFolderItems);
router.post('/:id/add-items', authMiddleware, adminOnly, addFolderItems);
router.delete('/:id', authMiddleware, adminOnly, deleteMusicFolder);

module.exports = router;
