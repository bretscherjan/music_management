const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../packages/shared/src/middlewares/auth.middleware');
const { permissionCheck } = require('../../../../packages/shared/src/middlewares/permission.middleware');
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

// Public/Member Routes (Read-only + Export)
router.get('/', authMiddleware, permissionCheck('folders:read'), getAllMusicFolders);
router.get('/:id', authMiddleware, permissionCheck('folders:read'), getMusicFolderById);
router.get('/:id/export-zip', authMiddleware, permissionCheck('folders:read'), exportFolderZip);
router.get('/:id/export-pdf', authMiddleware, permissionCheck('folders:read'), exportFolderPdf);

// Admin Routes (Management)
router.post('/', authMiddleware, permissionCheck('folders:write'), createMusicFolder);
router.put('/:id', authMiddleware, permissionCheck('folders:write'), updateMusicFolder);
router.post('/:id/items', authMiddleware, permissionCheck('folders:write'), setFolderItems);
router.post('/:id/add-items', authMiddleware, permissionCheck('folders:write'), addFolderItems);
router.delete('/:id', authMiddleware, permissionCheck('folders:write'), deleteMusicFolder);

module.exports = router;

