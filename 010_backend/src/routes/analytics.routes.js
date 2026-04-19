const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { roleCheck } = require('../middlewares/roleCheck.middleware');
const { trackPageViewPost } = require('../middlewares/traffic.middleware');
const {
    getTrafficStats,
    getTimeseries,
    getPopularPages,
    getGeoDistribution,
} = require('../controllers/analytics.controller');

// ── Public tracking endpoint (no auth) ──────────────────────────────────────
// Client-side SPA sends page views here
router.post('/pageview', trackPageViewPost);

// ── Admin-only analytics read endpoints ─────────────────────────────────────
router.get('/traffic', authMiddleware, roleCheck('admin'), getTrafficStats);
router.get('/traffic/timeseries', authMiddleware, roleCheck('admin'), getTimeseries);
router.get('/traffic/pages', authMiddleware, roleCheck('admin'), getPopularPages);
router.get('/traffic/geo', authMiddleware, roleCheck('admin'), getGeoDistribution);

module.exports = router;
