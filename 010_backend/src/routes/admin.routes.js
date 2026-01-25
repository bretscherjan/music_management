const express = require('express');
const router = express.Router();
const { getReminderStats } = require('../controllers/admin.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');

// Reminders status is accessible to all authenticated members
router.get('/reminders', authMiddleware, getReminderStats);

// Other admin routes require admin privileges
router.use(authMiddleware);
router.use(adminOnly);

// Add other admin-only routes here if needed

module.exports = router;
