const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

const { rateLimiter } = require('../middlewares/rateLimit.middleware');

// POST /api/contact - Submit contact form 
// Limit: 1 request per 1 hour (3600 seconds)
router.post('/', rateLimiter('ratelimit:contact', 3, 3600), contactController.submitContactForm);

module.exports = router;
