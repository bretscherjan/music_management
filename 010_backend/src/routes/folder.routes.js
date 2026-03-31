const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
const { createFolder, getFolderContents, updateFolder, deleteFolder, getAllFolders } = require('../controllers/folder.controller');

router.get('/', authMiddleware, permissionCheck('files:read'), getAllFolders);
router.post('/', authMiddleware, permissionCheck('files:upload'), createFolder);

router.put('/:id', authMiddleware, permissionCheck('files:upload'), updateFolder)
router.delete('/:id', authMiddleware, permissionCheck('files:permissions'), deleteFolder);

router.get('/:id/contents', authMiddleware, permissionCheck('files:read'), getFolderContents);

module.exports = router;
