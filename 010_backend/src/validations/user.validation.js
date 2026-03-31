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
        phoneNumber: z
            .string()
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
        type: z.enum(['REGULAR', 'GUEST']).optional(),
        expiresAt: z
            .string()
            .datetime()
            .optional()
            .nullable(),
        registerId: z
            .number()
            .int()
            .positive()
            .optional()
            .nullable(),
        phoneNumber: z
            .string()
            .optional()
            .nullable(),
    }),
};

// Admin: Update user permissions
const updateUserPermissionsSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige User-ID'),
    }),
    body: z.object({
        permissionKeys: z.array(z.string()).describe('Liste der Permission-Keys'),
    }),
};

const createPermissionTemplateSchema = {
    body: z.object({
        name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name darf maximal 100 Zeichen lang sein'),
        description: z.string().max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein').optional().nullable(),
        permissionKeys: z.array(z.string()).default([]),
    }),
};

const updatePermissionTemplateSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Vorlagen-ID'),
    }),
    body: z.object({
        name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name darf maximal 100 Zeichen lang sein'),
        description: z.string().max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein').optional().nullable(),
        permissionKeys: z.array(z.string()).default([]),
    }),
};

const deletePermissionTemplateSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Vorlagen-ID'),
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
        type: z.enum(['REGULAR', 'GUEST']).optional(),
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
        phoneNumber: z
            .string()
            .optional()
            .nullable(),
        password: z
            .string({ required_error: 'Passwort ist erforderlich' })
            .min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
        status: z.enum(['active', 'passive', 'former']).optional().default('active'),
        role: z.enum(['member', 'admin']).optional().default('member'),
        type: z.enum(['REGULAR', 'GUEST']).optional().default('REGULAR'),
        expiresAt: z
            .string()
            .datetime()
            .optional()
            .nullable(),
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
    updateUserPermissionsSchema,
    createPermissionTemplateSchema,
    updatePermissionTemplateSchema,
    deletePermissionTemplateSchema,
    adminUpdateUserSchema,
    getUserByIdSchema,
    queryUsersSchema,
    createUserSchema,
};
