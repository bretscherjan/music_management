const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const { assignDefaultPermissions } = require('../utils/permissions.seed');
const { expandPermissionKeys } = require('../utils/permissions');

const prisma = new PrismaClient();

function normalizePermissionKeys(permissionKeys = []) {
    return expandPermissionKeys(Array.from(new Set((permissionKeys || []).filter(Boolean))));
}

async function resolvePermissionKeys(permissionKeys = []) {
    const uniquePermissionKeys = normalizePermissionKeys(permissionKeys);

    const permissions = await prisma.permission.findMany({
        where: {
            key: { in: uniquePermissionKeys }
        }
    });

    if (permissions.length !== uniquePermissionKeys.length) {
        const foundKeys = new Set(permissions.map((permission) => permission.key));
        const missingKeys = uniquePermissionKeys.filter((key) => !foundKeys.has(key));
        throw new AppError(`Unbekannte Berechtigungen: ${missingKeys.join(', ')}`, 400);
    }

    return uniquePermissionKeys;
}

const userWithPermissionsSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    profilePicture: true,
    role: true,
    status: true,
    type: true,
    expiresAt: true,
    registerId: true,
    register: {
        select: { id: true, name: true },
    },
    createdAt: true,
    updatedAt: true,
    permissions: {
        include: {
            permission: true,
        },
    },
};

/**
 * Get own profile
 * GET /users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            ...userWithPermissionsSelect,
            _count: {
                select: { attendances: true },
            },
        },
    });

    if (!user) {
        throw new AppError('Benutzer nicht gefunden', 404);
    }

    res.json({ user });
});

/**
 * Update own profile
 * PUT /users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, phoneNumber, registerId } = req.body;

    // Validate registerId if provided
    if (registerId !== undefined && registerId !== null) {
        const register = await prisma.register.findUnique({
            where: { id: registerId },
        });
        if (!register) {
            throw new AppError('Register nicht gefunden', 404);
        }
    }

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phoneNumber !== undefined && { phoneNumber }), // Allow setting to null/string
            ...(registerId !== undefined && { registerId }),
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profilePicture: true,
            role: true,
            status: true,
            registerId: true,
            register: {
                select: { id: true, name: true },
            },
            updatedAt: true,
        },
    });

    res.json({
        message: 'Profil erfolgreich aktualisiert',
        user,
    });
});

/**
 * Update profile picture
 * PUT /users/profile/picture
 * Note: Handled via file upload, this updates the reference
 */
const updateProfilePicture = asyncHandler(async (req, res) => {
    const { profilePicture } = req.body;

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePicture },
        select: {
            id: true,
            profilePicture: true,
        },
    });

    res.json({
        message: 'Profilbild erfolgreich aktualisiert',
        user,
    });
});

/**
 * Get notification settings
 * GET /users/me/notifications
 */
const getNotificationSettings = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { notificationSettings: true },
    });

    if (!user) {
        throw new AppError('Benutzer nicht gefunden', 404);
    }

    res.json({
        settings: user.notificationSettings || {
            userId: user.id,
            notifyOnEventCreate: true,
            notifyOnEventUpdate: true,
            notifyOnEventDelete: true,
            notifyOnFileUpload: true,
            notifyOnFileDelete: false,
            notifyEventReminder: true,
            reminderTimeBeforeHours: 24,
            pushNewEvents: true,
            pushEventUpdates: true,
            pushEventCancellations: true,
            pushNewFiles: true,
            pushFileDeleted: false,
            pushReminders: true
        }
    });
});

const reminderQueueService = require('../services/reminder.queue.service');

/**
 * Update notification settings
 * PUT /users/me/notifications
 */
const updateNotificationSettings = asyncHandler(async (req, res) => {
    const {
        notifyOnEventCreate,
        notifyOnEventUpdate,
        notifyOnEventDelete,
        notifyOnFileUpload,
        notifyOnFileDelete,
        pushNewEvents,
        pushEventUpdates,
        pushEventCancellations,
        pushNewFiles,
        pushFileDeleted,
        reminderSettings
    } = req.body;

    const settings = await prisma.notificationSettings.upsert({
        where: { userId: req.user.id },
        update: {
            notifyOnEventCreate,
            notifyOnEventUpdate,
            notifyOnEventDelete,
            notifyOnFileUpload,
            notifyOnFileDelete,
            pushNewEvents,
            pushEventUpdates,
            pushEventCancellations,
            pushNewFiles,
            pushFileDeleted,
            reminderSettings
        },
        create: {
            userId: req.user.id,
            notifyOnEventCreate,
            notifyOnEventUpdate,
            notifyOnEventDelete,
            notifyOnFileUpload,
            notifyOnFileDelete,
            pushNewEvents,
            pushEventUpdates,
            pushEventCancellations,
            pushNewFiles,
            pushFileDeleted,
            reminderSettings
        }
    });

    // Re-sync reminders to apply new settings to existing events
    // This runs in background to not delay response too much
    reminderQueueService.syncReminders().catch(err => console.error('Error syncing reminders after settings update:', err));

    res.json({
        message: 'Benachrichtigungseinstellungen aktualisiert',
        settings
    });
});

/**
 * Change password
 * PUT /users/profile/password
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new AppError('Aktuelles Passwort ist falsch', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
    });

    res.json({
        message: 'Passwort erfolgreich geändert',
    });
});

/**
 * Create new user (Admin)
 * POST /users
 */
const createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password, status, role, type, expiresAt, registerId } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (userExists) {
        throw new AppError('Ein Benutzer mit dieser E-Mail existiert bereits', 400);
    }

    // Validate registerId if provided
    if (registerId !== undefined && registerId !== null) {
        const register = await prisma.register.findUnique({
            where: { id: registerId },
        });
        if (!register) {
            throw new AppError('Register nicht gefunden', 404);
        }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            password: hashedPassword,
            status: status || 'active',
            role: role || 'member',
            type: type || 'REGULAR',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            registerId,
        },
        select: {
            ...userWithPermissionsSelect,
        },
    });

    // Assign default permissions based on role
    await assignDefaultPermissions(user.id, user, { grantedBy: req.user.id });

    const createdUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: userWithPermissionsSelect,
    });

    res.status(201).json({
        message: 'Benutzer erfolgreich erstellt',
        user: createdUser,
    });
});

/**
 * Get all users (Admin)
 * GET /users
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const { status, role, type, registerId, search } = req.query;

    const whereClause = {};

    if (status) {
        whereClause.status = status;
    }

    if (role) {
        whereClause.role = role;
    }

    if (type) {
        whereClause.type = type;
    }

    if (registerId) {
        whereClause.registerId = parseInt(registerId);
    }

    if (search) {
        whereClause.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
        ];
    }

    const users = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profilePicture: true,
            role: true,
            status: true,
            type: true,
            expiresAt: true,
            registerId: true,
            register: {
                select: { id: true, name: true },
            },
            createdAt: true,
        },
        orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
        ],
    });

    res.json({
        users,
        count: users.length,
    });
});

/**
 * Get user by ID (Admin)
 * GET /users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
            ...userWithPermissionsSelect,
            attendances: {
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    event: {
                        select: { id: true, title: true, date: true },
                    },
                },
            }
        },
    });

    if (!user) {
        throw new AppError('Benutzer nicht gefunden', 404);
    }

    res.json({ user });
});

/**
 * Update user (Admin)
 * PUT /users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, status, role, type, expiresAt, registerId } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
    });

    if (!existingUser) {
        throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Check email uniqueness if changing email
    if (email && email.toLowerCase() !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (emailExists) {
            throw new AppError('Diese E-Mail-Adresse wird bereits verwendet', 409);
        }
    }

    if (parseInt(id) === req.user.id && role && role !== 'admin') {
        throw new AppError('Sie können Ihre eigene Rolle nicht ändern', 400);
    }

    // Validate registerId if provided
    if (registerId !== undefined && registerId !== null) {
        const register = await prisma.register.findUnique({
            where: { id: registerId },
        });
        if (!register) {
            throw new AppError('Register nicht gefunden', 404);
        }
    }

    const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phoneNumber !== undefined && { phoneNumber }),
            ...(email && { email: email.toLowerCase() }),
            ...(status && { status }),
            ...(role && { role }),
            ...(type && { type }),
            ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
            ...(registerId !== undefined && { registerId }),
        },
        select: userWithPermissionsSelect,
    });

    const roleChanged = role !== undefined && role !== existingUser.role;
    const typeChanged = type !== undefined && type !== existingUser.type;

    if (roleChanged || typeChanged) {
        await assignDefaultPermissions(user.id, user, { grantedBy: req.user.id });
    }

    const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: userWithPermissionsSelect,
    });

    res.json({
        message: 'Benutzer erfolgreich aktualisiert',
        user: updatedUser,
    });
});

/**
 * Get all available permissions
 * GET /users/permissions
 */
const getAllPermissions = asyncHandler(async (req, res) => {
    const permissions = await prisma.permission.findMany({
        orderBy: [
            { category: 'asc' },
            { key: 'asc' }
        ]
    });

    res.json({ permissions });
});

const getPermissionTemplates = asyncHandler(async (req, res) => {
    const templates = await prisma.permissionTemplate.findMany({
        orderBy: [
            { isSystem: 'desc' },
            { name: 'asc' },
        ],
    });

    res.json({ templates });
});

const createPermissionTemplate = asyncHandler(async (req, res) => {
    const { name, description, permissionKeys = [] } = req.body;
    const resolvedPermissionKeys = await resolvePermissionKeys(permissionKeys);

    const template = await prisma.permissionTemplate.create({
        data: {
            name,
            description,
            permissionKeys: resolvedPermissionKeys,
            createdBy: req.user.id,
            updatedBy: req.user.id,
        },
    });

    res.status(201).json({
        message: 'Vorlage erfolgreich erstellt',
        template,
    });
});

const updatePermissionTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, permissionKeys = [] } = req.body;
    const templateId = parseInt(id, 10);

    const existingTemplate = await prisma.permissionTemplate.findUnique({
        where: { id: templateId },
    });

    if (!existingTemplate) {
        throw new AppError('Vorlage nicht gefunden', 404);
    }

    const resolvedPermissionKeys = await resolvePermissionKeys(permissionKeys);

    const template = await prisma.permissionTemplate.update({
        where: { id: templateId },
        data: {
            name,
            description,
            permissionKeys: resolvedPermissionKeys,
            updatedBy: req.user.id,
        },
    });

    res.json({
        message: 'Vorlage erfolgreich aktualisiert',
        template,
    });
});

const deletePermissionTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const templateId = parseInt(id, 10);

    const existingTemplate = await prisma.permissionTemplate.findUnique({
        where: { id: templateId },
    });

    if (!existingTemplate) {
        throw new AppError('Vorlage nicht gefunden', 404);
    }

    if (existingTemplate.isSystem) {
        throw new AppError('System-Vorlagen konnen nicht geloscht werden', 400);
    }

    await prisma.permissionTemplate.delete({
        where: { id: templateId },
    });

    res.json({
        message: 'Vorlage erfolgreich geloscht',
    });
});

/**
 * Update user permissions
 * PATCH /users/:id/permissions
 */
const updateUserPermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissionKeys } = req.body;
    const userId = parseInt(id);
    const uniquePermissionKeys = await resolvePermissionKeys(permissionKeys);

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError('Benutzer nicht gefunden', 404);
    }

    const permissions = await prisma.permission.findMany({
        where: {
            key: { in: uniquePermissionKeys }
        }
    });

    // Delete existing permissions and create new ones in a transaction
    await prisma.$transaction(async (tx) => {
        await tx.userPermission.deleteMany({
            where: { userId }
        });

        if (permissions.length > 0) {
            await tx.userPermission.createMany({
                data: permissions.map((permission) => ({
                    userId,
                    permissionId: permission.id,
                    grantedBy: req.user.id,
                }))
            });
        }
    });

    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: userWithPermissionsSelect,
    });

    // Log the change
    const auditLogService = require('../utils/auditLog.service');
    await auditLogService.logEvent({
        action: 'user_permissions_updated',
        entity: 'User',
        entityId: id,
        userId: req.user.id,
        newValue: { permissionKeys: uniquePermissionKeys },
        req
    });

    res.json({
        message: 'Berechtigungen erfolgreich aktualisiert',
        user: updatedUser,
        permissions: uniquePermissionKeys
    });
});

/**
 * Update user status (Admin)
 * PUT /users/:id/status
 */
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { status },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
        },
    });

    res.json({
        message: 'Status erfolgreich aktualisiert',
        user,
    });
});

/**
 * Update user role (Admin)
 * PUT /users/:id/role
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent self-demotion for admins
    if (parseInt(id) === req.user.id && role !== 'admin') {
        throw new AppError('Sie können Ihre eigene Rolle nicht ändern', 400);
    }

    const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { role },
        select: userWithPermissionsSelect,
    });

    await assignDefaultPermissions(user.id, user, { grantedBy: req.user.id });

    const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: userWithPermissionsSelect,
    });

    res.json({
        message: 'Rolle erfolgreich aktualisiert',
        user: updatedUser,
    });
});

/**
 * Delete user (Admin)
 * DELETE /users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
        throw new AppError('Sie können Ihren eigenen Account nicht löschen', 400);
    }

    await prisma.user.delete({
        where: { id: parseInt(id) },
    });

    res.json({
        message: 'Benutzer erfolgreich gelöscht',
    });
});

/**
 * Get attendance statistics
 * GET /users/stats/attendance
 */
const getAttendanceStats = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
        dateFilter.date = {};
        if (fromDate) dateFilter.date.gte = new Date(fromDate);
        if (toDate) dateFilter.date.lte = new Date(toDate);
    }

    const users = await prisma.user.findMany({
        where: { status: 'active' },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            register: { select: { name: true } },
            attendances: {
                where: {
                    event: {
                        ...dateFilter
                    }
                },
                select: { status: true }
            }
        },
        orderBy: { lastName: 'asc' }
    });

    const stats = users.map(user => {
        const total = user.attendances.length;
        const yes = user.attendances.filter(a => a.status === 'yes').length;
        const no = user.attendances.filter(a => a.status === 'no').length;
        const maybe = user.attendances.filter(a => a.status === 'maybe').length;
        const rate = total > 0 ? Math.round((yes / total) * 100) : 0;

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            register: user.register?.name,
            stats: {
                yes,
                no,
                maybe,
                total,
                rate
            }
        };
    });

    res.json({ stats });
});

module.exports = {
    getProfile,
    updateProfile,
    updateProfilePicture,
    changePassword,
    getAllUsers,
    getUserById,
    updateUser,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getAttendanceStats,
    createUser,
    getNotificationSettings,
    updateNotificationSettings,
    getAllPermissions,
    getPermissionTemplates,
    createPermissionTemplate,
    updatePermissionTemplate,
    deletePermissionTemplate,
    updateUserPermissions,
};
