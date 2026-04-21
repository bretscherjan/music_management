const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
const {
    getAllSetlists,
    getSetlistById,
    createSetlist,
    updateSetlist,
    deleteSetlist,
    addItem,
    removeItem,
    reorderItems,
} = require('../controllers/setlist.controller');

router.use(authMiddleware);

router.get('/', permissionCheck('setlists:read'), getAllSetlists);
router.get('/:id', permissionCheck('setlists:read'), getSetlistById);
router.post('/', permissionCheck('setlists:write'), createSetlist);
router.put('/:id', permissionCheck('setlists:write'), updateSetlist);
router.delete('/:id', permissionCheck('setlists:write'), deleteSetlist);

router.post('/:id/items', permissionCheck('setlists:write'), addItem);
router.delete('/:id/items/:itemId', permissionCheck('setlists:write'), removeItem);
router.put('/:id/items/reorder', permissionCheck('setlists:write'), reorderItems);

module.exports = router;
