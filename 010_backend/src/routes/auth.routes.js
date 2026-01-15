const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

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
router.post('/refresh', authMiddleware, authController.refreshToken);

module.exports = router;
