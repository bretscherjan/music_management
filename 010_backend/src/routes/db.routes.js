const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');
const dbController = require('../controllers/db.controller');

/**
 * All DB Previewer routes are strictly Admin Only
 */
router.use(authMiddleware, adminOnly);

router.get('/tables', dbController.getTables);
router.get('/tables/:tableName/columns', dbController.getTableColumns);
router.get('/tables/:tableName/data', dbController.getTableData);
router.post('/execute-sql', dbController.executeSql);
router.put('/tables/:tableName/row', dbController.updateRow);

module.exports = router;
