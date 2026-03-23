const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authMiddleware, refreshTokenMiddleware } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validations/auth.validation');
const { rateLimiter } = require('../middlewares/rateLimit.middleware');

// Brute-force protection
// Login: per-email (user-specific, tight) + per-IP (looser, DDoS/enumeration guard)
const loginLimitByEmail = rateLimiter('ratelimit:login:email', 5,  15 * 60, (req) => req.body?.email?.toLowerCase()?.trim());
const loginLimitByIp    = rateLimiter('ratelimit:login:ip',   30,  15 * 60);
const registerLimit     = rateLimiter('ratelimit:register',    5,  60 * 60);  // 5  req / hour
const forgotPassLimit   = rateLimiter('ratelimit:forgot-password', 3, 60 * 60);  // 3  req / hour

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
router.post('/login', loginLimitByIp, loginLimitByEmail, validate(loginSchema), authController.login);

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
router.post('/refresh', refreshTokenMiddleware, authController.refreshToken);

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
