const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
    updateProfileSchema,
    changePasswordSchema,
    updateUserStatusSchema,
    updateUserRoleSchema,
    adminUpdateUserSchema,
    getUserByIdSchema,
    queryUsersSchema,
    createUserSchema,
    updateUserPermissionsSchema,
} = require('../validations/user.validation');

// ============================================
// Self-service routes (authenticated users)
// ============================================

/**
 * @route   GET /api/users/profile
 * @desc    Get own profile
 * @access  Private
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
router.put('/profile', authMiddleware, validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   PUT /api/users/profile/password
 * @desc    Change own password
 * @access  Private
 */
router.put('/profile/password', authMiddleware, validate(changePasswordSchema), userController.changePassword);

/**
 * @route   PUT /api/users/profile/picture
 * @desc    Update profile picture reference
 * @access  Private
 */
router.put('/profile/picture', authMiddleware, userController.updateProfilePicture);

/**
 * @route   GET /api/users/me/notifications
 * @desc    Get notification settings
 * @access  Private
 */
router.get('/me/notifications', authMiddleware, userController.getNotificationSettings);

/**
 * @route   PUT /api/users/me/notifications
 * @desc    Update notification settings
 * @access  Private
 */
router.put('/me/notifications', authMiddleware, userController.updateNotificationSettings);


// ============================================
// Admin routes
// ============================================

/**
 * @route   GET /api/users/permissions
 * @desc    Get all available permissions
 * @access  Admin only
 */
router.get('/permissions', authMiddleware, adminOnly, userController.getAllPermissions);

/**
 * @route   PATCH /api/users/:id/permissions
 * @desc    Update user permissions
 * @access  Admin only
 */
router.patch('/:id/permissions', authMiddleware, adminOnly, validate(updateUserPermissionsSchema), userController.updateUserPermissions);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin only
 */
router.post('/', authMiddleware, adminOnly, validate(createUserSchema), userController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users (for member list)
 * @access  All authenticated members
 */
router.get('/', authMiddleware, validate(queryUsersSchema), userController.getAllUsers);

/**
 * @route   GET /api/users/stats/attendance
 * @desc    Get attendance statistics
 * @access  Admin only
 */
router.get('/stats/attendance', authMiddleware, adminOnly, userController.getAttendanceStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get('/:id', authMiddleware, adminOnly, validate(getUserByIdSchema), userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin only
 */
router.put('/:id', authMiddleware, adminOnly, validate(adminUpdateUserSchema), userController.updateUser);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status
 * @access  Admin only
 */
router.put('/:id/status', authMiddleware, adminOnly, validate(updateUserStatusSchema), userController.updateUserStatus);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 */
router.put('/:id/role', authMiddleware, adminOnly, validate(updateUserRoleSchema), userController.updateUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, validate(getUserByIdSchema), userController.deleteUser);

module.exports = router;
