const { z } = require('zod');

/**
 * User Validation Schemas
 */

// Update own profile
const updateProfileSchema = {
    body: z.object({
        firstName: z
            .string()
            .min(1, 'Vorname ist erforderlich')
            .max(50, 'Vorname darf maximal 50 Zeichen lang sein')
            .optional(),
        lastName: z
            .string()
            .min(1, 'Nachname ist erforderlich')
            .max(50, 'Nachname darf maximal 50 Zeichen lang sein')
            .optional(),
        registerId: z
            .number()
            .int()
            .positive()
            .optional()
            .nullable(),
    }),
};

// Change password
const changePasswordSchema = {
    body: z.object({
        currentPassword: z
            .string({ required_error: 'Aktuelles Passwort ist erforderlich' })
            .min(1, 'Aktuelles Passwort ist erforderlich'),
        newPassword: z
            .string({ required_error: 'Neues Passwort ist erforderlich' })
            .min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Passwort muss mindestens einen Grossbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
            ),
        confirmPassword: z
            .string({ required_error: 'Passwortbestätigung ist erforderlich' }),
    }).refine(
        (data) => data.newPassword === data.confirmPassword,
        { message: 'Passwörter stimmen nicht überein', path: ['confirmPassword'] }
    ),
};

// Admin: Update user status
const updateUserStatusSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige User-ID'),
    }),
    body: z.object({
        status: z.enum(['active', 'passive', 'former'], {
            errorMap: () => ({ message: 'Ungültiger Status' }),
        }),
    }),
};

// Admin: Update user role
const updateUserRoleSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige User-ID'),
    }),
    body: z.object({
        role: z.enum(['member', 'admin'], {
            errorMap: () => ({ message: 'Ungültige Rolle' }),
        }),
    }),
};

// Admin: Update user (full)
const adminUpdateUserSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige User-ID'),
    }),
    body: z.object({
        firstName: z
            .string()
            .min(1)
            .max(50)
            .optional(),
        lastName: z
            .string()
            .min(1)
            .max(50)
            .optional(),
        email: z
            .string()
            .email('Ungültige E-Mail-Adresse')
            .optional(),
        status: z.enum(['active', 'passive', 'former']).optional(),
        role: z.enum(['member', 'admin']).optional(),
        registerId: z
            .number()
            .int()
            .positive()
            .optional()
            .nullable(),
    }),
};

// Get user by ID
const getUserByIdSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige User-ID'),
    }),
};

// Query users
const queryUsersSchema = {
    query: z.object({
        status: z.enum(['active', 'passive', 'former']).optional(),
        role: z.enum(['member', 'admin']).optional(),
        registerId: z.string().regex(/^\d+$/).optional(),
        search: z.string().max(100).optional(),
    }),
};

// Admin: Create user
const createUserSchema = {
    body: z.object({
        firstName: z
            .string({ required_error: 'Vorname ist erforderlich' })
            .min(1, 'Vorname ist erforderlich')
            .max(50, 'Vorname darf maximal 50 Zeichen lang sein'),
        lastName: z
            .string({ required_error: 'Nachname ist erforderlich' })
            .min(1, 'Nachname ist erforderlich')
            .max(50, 'Nachname darf maximal 50 Zeichen lang sein'),
        email: z
            .string({ required_error: 'E-Mail ist erforderlich' })
            .email('Ungültige E-Mail-Adresse'),
        password: z
            .string({ required_error: 'Passwort ist erforderlich' })
            .min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
        status: z.enum(['active', 'passive', 'former']).optional().default('active'),
        role: z.enum(['member', 'admin']).optional().default('member'),
        registerId: z
            .number()
            .int()
            .positive()
            .optional()
            .nullable(),
    }),
};

module.exports = {
    updateProfileSchema,
    changePasswordSchema,
    updateUserStatusSchema,
    updateUserRoleSchema,
    adminUpdateUserSchema,
    getUserByIdSchema,
    queryUsersSchema,
    createUserSchema,
};
