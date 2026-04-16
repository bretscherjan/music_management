const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/search.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/search
 * @desc    Global search across files, folders, events, and members
 * @access  Private – results filtered by the caller's permissions
 * @query   q        {string}  Search query (min 2 chars)
 * @query   category {string}  all | files | folders | events | members  (default: all)
 */
router.get('/', authMiddleware, globalSearch);

module.exports = router;
