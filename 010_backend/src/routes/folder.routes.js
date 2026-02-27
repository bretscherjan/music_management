const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { createFolder, getFolderContents, updateFolder, deleteFolder, getAllFolders } = require('../controllers/folder.controller');

router.get('/', authMiddleware, getAllFolders);
router.post('/', authMiddleware, adminOnly, createFolder);

router.put('/:id', authMiddleware, adminOnly, updateFolder)
router.delete('/:id', authMiddleware, adminOnly, deleteFolder);

router.get('/:id/contents', authMiddleware, getFolderContents);

module.exports = router;
