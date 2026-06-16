const { z } = require('zod');

/**
 * Auth Validation Schemas
 */

// Register new user
const registerSchema = {
    body: z.object({
        email: z
            .string({ required_error: 'E-Mail ist erforderlich' })
            .email('Ungültige E-Mail-Adresse'),
        password: z
            .string({ required_error: 'Passwort ist erforderlich' })
            .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Passwort muss mindestens einen Grossbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
            ),
        firstName: z
            .string({ required_error: 'Vorname ist erforderlich' })
            .min(1, 'Vorname ist erforderlich')
            .max(50, 'Vorname darf maximal 50 Zeichen lang sein'),
        lastName: z
            .string({ required_error: 'Nachname ist erforderlich' })
            .min(1, 'Nachname ist erforderlich')
            .max(50, 'Nachname darf maximal 50 Zeichen lang sein'),
        registerId: z
            .number()
            .int()
            .positive()
            .optional(),
    }),
};

// Login
const loginSchema = {
    body: z.object({
        email: z
            .string({ required_error: 'E-Mail ist erforderlich' })
            .email('Ungültige E-Mail-Adresse'),
        password: z
            .string({ required_error: 'Passwort ist erforderlich' })
            .min(1, 'Passwort ist erforderlich'),
    }),
};

module.exports = {
    registerSchema,
    loginSchema,
};
