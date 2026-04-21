const prisma = require('../utils/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');

// GET /api/setlists
const getAllSetlists = asyncHandler(async (req, res) => {
    const setlists = await prisma.setlist.findMany({
        include: {
            event: { select: { id: true, title: true, date: true } },
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: { select: { id: true, title: true, composer: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(setlists);
});

// GET /api/setlists/:id
const getSetlistById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const setlist = await prisma.setlist.findUnique({
        where: { id: parseInt(id) },
        include: {
            event: { select: { id: true, title: true, date: true } },
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: { select: { id: true, title: true, composer: true, genre: true } },
                },
            },
        },
    });
    if (!setlist) throw new AppError('Setlist nicht gefunden', 404);
    res.json(setlist);
});

// POST /api/setlists
const createSetlist = asyncHandler(async (req, res) => {
    const { name, description, eventId } = req.body;
    if (!name) throw new AppError('Name ist erforderlich', 400);

    const setlist = await prisma.setlist.create({
        data: {
            name,
            description: description || null,
            eventId: eventId ? parseInt(eventId) : null,
        },
        include: {
            event: { select: { id: true, title: true, date: true } },
            items: true,
        },
    });
    res.status(201).json(setlist);
});

// PUT /api/setlists/:id
const updateSetlist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, eventId } = req.body;

    const setlist = await prisma.setlist.findUnique({ where: { id: parseInt(id) } });
    if (!setlist) throw new AppError('Setlist nicht gefunden', 404);

    const updated = await prisma.setlist.update({
        where: { id: parseInt(id) },
        data: {
            name: name ?? setlist.name,
            description: description !== undefined ? description : setlist.description,
            eventId: eventId !== undefined ? (eventId ? parseInt(eventId) : null) : setlist.eventId,
        },
        include: {
            event: { select: { id: true, title: true, date: true } },
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: { select: { id: true, title: true, composer: true } },
                },
            },
        },
    });
    res.json(updated);
});

// DELETE /api/setlists/:id
const deleteSetlist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const setlist = await prisma.setlist.findUnique({ where: { id: parseInt(id) } });
    if (!setlist) throw new AppError('Setlist nicht gefunden', 404);

    await prisma.setlist.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
});

// POST /api/setlists/:id/items
const addItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { sheetMusicId, title, notes, duration, type } = req.body;

    const setlist = await prisma.setlist.findUnique({ where: { id: parseInt(id) } });
    if (!setlist) throw new AppError('Setlist nicht gefunden', 404);

    // Find next position
    const lastItem = await prisma.setlistItem.findFirst({
        where: { setlistId: parseInt(id) },
        orderBy: { position: 'desc' },
    });
    const position = lastItem ? lastItem.position + 1 : 0;

    const item = await prisma.setlistItem.create({
        data: {
            setlistId: parseInt(id),
            sheetMusicId: sheetMusicId ? parseInt(sheetMusicId) : null,
            title: title || null,
            notes: notes || null,
            duration: duration ? parseInt(duration) : null,
            type: type || 'sheetMusic',
            position,
        },
        include: {
            sheetMusic: { select: { id: true, title: true, composer: true } },
        },
    });
    res.status(201).json(item);
});

// DELETE /api/setlists/:id/items/:itemId
const removeItem = asyncHandler(async (req, res) => {
    const { id, itemId } = req.params;
    const item = await prisma.setlistItem.findFirst({
        where: { id: parseInt(itemId), setlistId: parseInt(id) },
    });
    if (!item) throw new AppError('Item nicht gefunden', 404);

    await prisma.setlistItem.delete({ where: { id: parseInt(itemId) } });
    res.status(204).send();
});

// PUT /api/setlists/:id/items/reorder
// Body: { items: [{ id, position }] }
const reorderItems = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) throw new AppError('items muss ein Array sein', 400);

    const setlist = await prisma.setlist.findUnique({ where: { id: parseInt(id) } });
    if (!setlist) throw new AppError('Setlist nicht gefunden', 404);

    await prisma.$transaction(
        items.map(({ id: itemId, position }) =>
            prisma.setlistItem.update({
                where: { id: parseInt(itemId) },
                data: { position: parseInt(position) },
            })
        )
    );

    const updated = await prisma.setlist.findUnique({
        where: { id: parseInt(id) },
        include: {
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: { select: { id: true, title: true, composer: true } },
                },
            },
        },
    });
    res.json(updated);
});

module.exports = {
    getAllSetlists,
    getSetlistById,
    createSetlist,
    updateSetlist,
    deleteSetlist,
    addItem,
    removeItem,
    reorderItems,
};
