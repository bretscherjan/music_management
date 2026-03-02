const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');
const { logEvent } = require('../utils/auditLog.service');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Register a new user
 * POST /auth/register
 */
const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, registerId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (existingUser) {
        throw new AppError('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits', 409);
    }

    // Validate registerId if provided
    if (registerId) {
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
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName,
            lastName,
            registerId,
            calendarToken: crypto.randomBytes(32).toString('hex'),
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            registerId: true,
            register: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdAt: true,
        },
    });

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user).catch(err => {
        console.error('Failed to send welcome email:', err);
    });

    res.status(201).json({
        message: 'Registrierung erfolgreich',
        user,
        token,
    });
});

/**
 * Login user
 * POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
            register: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError('Ungültige E-Mail oder Passwort', 401);
    }

    // Check if user is not former
    if (user.status === 'former') {
        throw new AppError('Dieses Konto wurde deaktiviert', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new AppError('Ungültige E-Mail oder Passwort', 401);
    }

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update lastLoginAt, lastSeenAt and log audit event (non-blocking)
    const now = new Date();
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now, lastSeenAt: now } }).catch(() => {});
    logEvent({ action: 'LOGIN', entity: 'User', entityId: user.id, userId: user.id, req });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        message: 'Login erfolgreich',
        user: userWithoutPassword,
        token,
    });
});

/**
 * Get current user
 * GET /auth/me
 */
const getMe = asyncHandler(async (req, res) => {
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
                select: {
                    id: true,
                    name: true,
                },
            },
            createdAt: true,
            updatedAt: true,
            calendarToken: true,
        },
    });

    if (!user) {
        throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Lazy generation of calendar token if missing
    if (!user.calendarToken) {
        const newToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: { calendarToken: newToken }
        });
        user.calendarToken = newToken;
    }

    res.json({ user });
});

/**
 * Refresh token
 * POST /auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
    // User is already authenticated via middleware
    const token = jwt.sign(
        { userId: req.user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
        message: 'Token aktualisiert',
        token,
    });
});

/**
 * Request password reset
 * POST /auth/forgot-password
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (!user) {
        return res.json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link gesendet.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to DB with expiry (1 hour)
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: resetTokenHash,
            resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
        await sendPasswordResetEmail(user, resetUrl);
    } catch (err) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        throw new AppError('E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.', 500);
    }

    res.json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link gesendet.' });
});

/**
 * Reset password
 * POST /auth/reset-password/:token
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
        where: {
            resetToken: resetTokenHash,
            resetTokenExpiry: { gt: new Date() }
        }
    });

    if (!user) {
        throw new AppError('Ungültiger oder abgelaufener Token', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    });

    res.json({ message: 'Passwort erfolgreich geändert. Bitte logge dich ein.' });
});

module.exports = {
    register,
    login,
    getMe,
    refreshToken,
    requestPasswordReset,
    resetPassword
};
