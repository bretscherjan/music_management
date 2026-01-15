const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Get all registers
 * GET /registers
 */
const getAllRegisters = asyncHandler(async (req, res) => {
    const registers = await prisma.register.findMany({
        include: {
            _count: {
                select: { users: true },
            },
        },
        orderBy: { name: 'asc' },
    });

    res.json({
        registers: registers.map(r => ({
            id: r.id,
            name: r.name,
            memberCount: r._count.users,
        })),
        count: registers.length,
    });
});

/**
 * Get register by ID
 * GET /registers/:id
 */
const getRegisterById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const register = await prisma.register.findUnique({
        where: { id: parseInt(id) },
        include: {
            users: {
                where: { status: { not: 'former' } },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                },
                orderBy: { lastName: 'asc' },
            },
            _count: {
                select: { files: true },
            },
        },
    });

    if (!register) {
        throw new AppError('Register nicht gefunden', 404);
    }

    res.json({
        register: {
            id: register.id,
            name: register.name,
            users: register.users,
            fileCount: register._count.files,
        },
    });
});

/**
 * Create register (Admin)
 * POST /registers
 */
const createRegister = asyncHandler(async (req, res) => {
    const { name, assignUserIds } = req.body;

    const data = { name };
    if (assignUserIds && Array.isArray(assignUserIds)) {
        data.users = {
            connect: assignUserIds.map(uid => ({ id: uid }))
        };
    }

    const register = await prisma.register.create({
        data,
    });

    res.status(201).json({
        message: 'Register erfolgreich erstellt',
        register,
    });
});

/**
 * Update register (Admin)
 * PUT /registers/:id
 */
const updateRegister = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, assignUserIds } = req.body;

    const data = { name };

    // If assignUserIds is provided, we update those users using a transaction
    if (assignUserIds && Array.isArray(assignUserIds)) {
        // Strategy: 
        // 1. Unset registerId for all users currently in this register
        // 2. Set registerId for users in assignUserIds

        // We use a transaction to ensure integrity
        const [updatedRegister] = await prisma.$transaction([
            // 1. Update the register details
            prisma.register.update({
                where: { id: parseInt(id) },
                data: { name },
            }),
            // 2. Disconnect ALL current members (set registerId to null)
            prisma.user.updateMany({
                where: { registerId: parseInt(id) },
                data: { registerId: null },
            }),
            // 3. Connect new members (set registerId to this register)
            prisma.user.updateMany({
                where: { id: { in: assignUserIds } },
                data: { registerId: parseInt(id) },
            }),
        ]);

        // Fetch the updated register with relations to return complete object
        const finalRegister = await prisma.register.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: { select: { users: true } },
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                    },
                }
            }
        });

        return res.json({
            message: 'Register erfolgreich aktualisiert',
            register: {
                id: finalRegister.id,
                name: finalRegister.name,
                users: finalRegister.users,
                memberCount: finalRegister._count.users
            },
        });
    }

    // Normal update without user changes
    const register = await prisma.register.update({
        where: { id: parseInt(id) },
        data,
    });

    res.json({
        message: 'Register erfolgreich aktualisiert',
        register,
    });
});

/**
 * Delete register (Admin)
 * DELETE /registers/:id
 */
const deleteRegister = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if register has members
    const register = await prisma.register.findUnique({
        where: { id: parseInt(id) },
        include: {
            _count: {
                select: { users: true },
            },
        },
    });

    if (!register) {
        throw new AppError('Register nicht gefunden', 404);
    }

    if (register._count.users > 0) {
        throw new AppError(
            'Register kann nicht gelöscht werden, da noch Mitglieder zugeordnet sind',
            400
        );
    }

    await prisma.register.delete({
        where: { id: parseInt(id) },
    });

    res.json({
        message: 'Register erfolgreich gelöscht',
    });
});

module.exports = {
    getAllRegisters,
    getRegisterById,
    createRegister,
    updateRegister,
    deleteRegister,
};
