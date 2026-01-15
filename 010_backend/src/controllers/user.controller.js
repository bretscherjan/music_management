const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Get own profile
 * GET /users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
            status: true,
            registerId: true,
            register: {
                select: { id: true, name: true },
            },
            createdAt: true,
            updatedAt: true,
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
    const { firstName, lastName, registerId } = req.body;

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
            ...(registerId !== undefined && { registerId }),
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
    const { firstName, lastName, email, password, status, role, registerId } = req.body;

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
            password: hashedPassword,
            status: status || 'active',
            role: role || 'member',
            registerId,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            registerId: true,
            register: {
                select: { id: true, name: true },
            },
            createdAt: true,
        },
    });

    res.status(201).json({
        message: 'Benutzer erfolgreich erstellt',
        user,
    });
});

/**
 * Get all users (Admin)
 * GET /users
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const { status, role, registerId, search } = req.query;

    const whereClause = {};

    if (status) {
        whereClause.status = status;
    }

    if (role) {
        whereClause.role = role;
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
            profilePicture: true,
            role: true,
            status: true,
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
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
            status: true,
            registerId: true,
            register: {
                select: { id: true, name: true },
            },
            createdAt: true,
            updatedAt: true,
            attendances: {
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    event: {
                        select: { id: true, title: true, date: true },
                    },
                },
            },
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
    const { firstName, lastName, email, phoneNumber, status, role, registerId } = req.body;

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
            ...(phoneNumber && { phoneNumber }),
            ...(email && { email: email.toLowerCase() }),
            ...(status && { status }),
            ...(role && { role }),
            ...(registerId !== undefined && { registerId }),
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
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
        message: 'Benutzer erfolgreich aktualisiert',
        user,
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
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
        },
    });

    res.json({
        message: 'Rolle erfolgreich aktualisiert',
        user,
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
};
