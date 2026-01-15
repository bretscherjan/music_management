const express = require('express');
const router = express.Router();
const { z } = require('zod');

const registerController = require('../controllers/register.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { validate } = require('../middlewares/validate.middleware');

// Validation schemas
const createRegisterSchema = {
    body: z.object({
        name: z
            .string({ required_error: 'Name ist erforderlich' })
            .min(1, 'Name ist erforderlich')
            .max(100, 'Name darf maximal 100 Zeichen lang sein'),
        assignUserIds: z.array(z.number()).optional(),
    }),
};

const updateRegisterSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Register-ID'),
    }),
    body: z.object({
        name: z
            .string()
            .min(1, 'Name ist erforderlich')
            .max(100, 'Name darf maximal 100 Zeichen lang sein'),
        assignUserIds: z.array(z.number()).optional(),
    }),
};

const getRegisterByIdSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Ungültige Register-ID'),
    }),
};

/**
 * @route   GET /api/registers
 * @desc    Get all registers
 * @access  Private (authenticated users)
 */
router.get('/', authMiddleware, registerController.getAllRegisters);

/**
 * @route   GET /api/registers/:id
 * @desc    Get register by ID with members
 * @access  Private (authenticated users)
 */
router.get('/:id', authMiddleware, validate(getRegisterByIdSchema), registerController.getRegisterById);

/**
 * @route   POST /api/registers
 * @desc    Create new register
 * @access  Admin only
 */
router.post('/', authMiddleware, adminOnly, validate(createRegisterSchema), registerController.createRegister);

/**
 * @route   PUT /api/registers/:id
 * @desc    Update register
 * @access  Admin only
 */
router.put('/:id', authMiddleware, adminOnly, validate(updateRegisterSchema), registerController.updateRegister);

/**
 * @route   DELETE /api/registers/:id
 * @desc    Delete register
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, validate(getRegisterByIdSchema), registerController.deleteRegister);

module.exports = router;
