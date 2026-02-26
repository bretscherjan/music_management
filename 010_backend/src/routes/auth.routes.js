const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validations/auth.validation');
const { rateLimiter } = require('../middlewares/rateLimit.middleware');

// Brute-force protection
const loginLimit        = rateLimiter('ratelimit:login',          10,  15 * 60);  // 10 req / 15 min
const registerLimit     = rateLimiter('ratelimit:register',        5,  60 * 60);  // 5  req / hour
const forgotPassLimit   = rateLimiter('ratelimit:forgot-password', 3,  60 * 60);  // 3  req / hour

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerLimit, validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginLimit, validate(loginSchema), authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Private
 */
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Private
 */
router.post('/refresh', authMiddleware, authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset link
 * @access  Public
 */
router.post('/forgot-password', forgotPassLimit, authController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
