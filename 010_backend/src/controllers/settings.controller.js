const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Get all settings
 * GET /settings
 */
const getSettings = asyncHandler(async (req, res) => {
    const settings = await prisma.setting.findMany();

    // Convert to key-value object for easier frontend usage
    const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

    res.json({
        settings: settingsMap,
    });
});

/**
 * Get a single setting by key
 * GET /settings/:key
 */
const getSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;

    const setting = await prisma.setting.findUnique({
        where: { key },
    });

    if (!setting) {
        throw new AppError('Einstellung nicht gefunden', 404);
    }

    res.json({
        setting,
    });
});

/**
 * Update or create a setting
 * PUT /settings/:key
 */
const updateSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
        throw new AppError('Wert ist erforderlich', 400);
    }

    // Validate specific settings
    if (key === 'defaultAttendanceStatus') {
        const validStatuses = ['yes', 'no', 'maybe', 'none'];
        if (!validStatuses.includes(value)) {
            throw new AppError(`Ungültiger Status. Erlaubt: ${validStatuses.join(', ')}`, 400);
        }
    }

    const setting = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });

    res.json({
        message: 'Einstellung erfolgreich aktualisiert',
        setting,
    });
});

/**
 * Initialize default settings (called on app startup)
 */
const initializeDefaultSettings = async () => {
    const defaultSettings = [
        { key: 'defaultAttendanceStatus', value: 'maybe' },
    ];

    for (const setting of defaultSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {}, // Don't update if exists
            create: setting,
        });
    }
};

module.exports = {
    getSettings,
    getSetting,
    updateSetting,
    initializeDefaultSettings,
};
