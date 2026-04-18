const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { getUnreadCounts, markCategoryRead } = require('../controllers/notification.controller');

// All notification routes require authentication
router.use(authMiddleware);

// GET  /notifications/unread-counts
router.get('/unread-counts', getUnreadCounts);

// POST /notifications/mark-read
router.post('/mark-read', markCategoryRead);

module.exports = router;
