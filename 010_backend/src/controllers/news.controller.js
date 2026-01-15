const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Get all news
 * GET /news
 */
const getAllNews = asyncHandler(async (req, res) => {
    const { limit = 10, offset = 0 } = req.query;

    const [news, total] = await Promise.all([
        prisma.news.findMany({
            skip: parseInt(offset),
            take: parseInt(limit),
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.news.count(),
    ]);

    res.json({
        news,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + news.length < total,
        },
    });
});

/**
 * Get news by ID
 * GET /news/:id
 */
const getNewsById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const news = await prisma.news.findUnique({
        where: { id: parseInt(id) },
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    if (!news) {
        throw new AppError('News nicht gefunden', 404);
    }

    res.json({ news });
});

/**
 * Create news
 * POST /news
 */
const createNews = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const authorId = req.user.id;

    const news = await prisma.news.create({
        data: {
            title,
            content,
            authorId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    res.status(201).json({
        message: 'News erfolgreich erstellt',
        news,
    });
});

/**
 * Update news
 * PUT /news/:id
 */
const updateNews = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    const news = await prisma.news.update({
        where: { id: parseInt(id) },
        data: {
            ...(title && { title }),
            ...(content && { content }),
        },
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    res.json({
        message: 'News erfolgreich aktualisiert',
        news,
    });
});

/**
 * Delete news
 * DELETE /news/:id
 */
const deleteNews = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.news.delete({
        where: { id: parseInt(id) },
    });

    res.json({
        message: 'News erfolgreich gelöscht',
    });
});

module.exports = {
    getAllNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
};
