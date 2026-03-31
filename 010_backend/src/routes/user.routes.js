const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
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
    createPermissionTemplateSchema,
    updatePermissionTemplateSchema,
    deletePermissionTemplateSchema,
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
router.get('/permissions', authMiddleware, permissionCheck('members:permissions'), userController.getAllPermissions);

router.get('/permission-templates', authMiddleware, permissionCheck('members:permissions'), userController.getPermissionTemplates);

router.post('/permission-templates', authMiddleware, permissionCheck('members:permissions'), validate(createPermissionTemplateSchema), userController.createPermissionTemplate);

router.put('/permission-templates/:id', authMiddleware, permissionCheck('members:permissions'), validate(updatePermissionTemplateSchema), userController.updatePermissionTemplate);

router.delete('/permission-templates/:id', authMiddleware, permissionCheck('members:permissions'), validate(deletePermissionTemplateSchema), userController.deletePermissionTemplate);

/**
 * @route   PATCH /api/users/:id/permissions
 * @desc    Update user permissions
 * @access  Admin only
 */
router.patch('/:id/permissions', authMiddleware, permissionCheck('members:permissions'), validate(updateUserPermissionsSchema), userController.updateUserPermissions);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin only
 */
router.post('/', authMiddleware, permissionCheck('members:write'), validate(createUserSchema), userController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users (for member list)
 * @access  All authenticated members
 */
router.get('/', authMiddleware, permissionCheck('members:read'), validate(queryUsersSchema), userController.getAllUsers);

/**
 * @route   GET /api/users/stats/attendance
 * @desc    Get attendance statistics
 * @access  Admin only
 */
router.get('/stats/attendance', authMiddleware, permissionCheck('statistics:read'), userController.getAttendanceStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get('/:id', authMiddleware, permissionCheck('members:write'), validate(getUserByIdSchema), userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin only
 */
router.put('/:id', authMiddleware, permissionCheck('members:write'), validate(adminUpdateUserSchema), userController.updateUser);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status
 * @access  Admin only
 */
router.put('/:id/status', authMiddleware, permissionCheck('members:write'), validate(updateUserStatusSchema), userController.updateUserStatus);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 */
router.put('/:id/role', authMiddleware, permissionCheck('members:write'), validate(updateUserRoleSchema), userController.updateUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, permissionCheck('members:write'), validate(getUserByIdSchema), userController.deleteUser);

module.exports = router;
