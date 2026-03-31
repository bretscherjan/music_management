const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
const dbController = require('../controllers/db.controller');

/**
 * All DB Previewer routes are strictly Admin Only
 */
router.use(authMiddleware);

router.get('/tables', permissionCheck('db:read'), dbController.getTables);
router.get('/relations', permissionCheck('db:read'), dbController.getRelations);
router.get('/tables/:tableName/columns', permissionCheck('db:read'), dbController.getTableColumns);
router.get('/tables/:tableName/data', permissionCheck('db:read'), dbController.getTableData);
router.post('/execute-sql', permissionCheck('db:write'), dbController.executeSql);
router.put('/tables/:tableName/row', permissionCheck('db:write'), dbController.updateRow);

module.exports = router;
