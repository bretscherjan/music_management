const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');

router.use(authMiddleware);
router.use(adminOnly);

router.get('/',       auditController.getAuditLogs);
router.get('/filters', auditController.getAuditFilters);

// ── Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics/peak-times',           auditController.getPeakTimes);
router.get('/analytics/feature-usage',        auditController.getFeatureUsage);
router.get('/analytics/online-now',           auditController.getOnlineNow);
router.get('/analytics/activity-by-register', auditController.getActivityByRegister);
router.get('/analytics/top-users',            auditController.getTopUsers);
router.get('/analytics/inactive-users',       auditController.getInactiveUsers);
router.get('/analytics/newly-registered',     auditController.getNewlyRegisteredUsers);
router.get('/analytics/all-users-engagement', auditController.getAllUsersWithEngagement);

module.exports = router;
