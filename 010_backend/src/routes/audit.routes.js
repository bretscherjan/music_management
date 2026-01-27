const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');

// All audit routes are protected and restricted to Admin
router.use(authMiddleware);
router.use(adminOnly);

router.get('/', auditController.getAuditLogs);
router.get('/filters', auditController.getAuditFilters);

module.exports = router;
