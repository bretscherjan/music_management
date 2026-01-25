const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Get all sheet music with search, filter, sort, and pagination
 * GET /sheet-music
 */
const getAllSheetMusic = asyncHandler(async (req, res) => {
    const {
        search,
        genre,
        difficulty,
        bookmarkedBy,
        sort = 'title',
        page = 1,
        limit = 50,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const whereClause = {};

    // Search in title, composer, arranger
    if (search) {
        whereClause.OR = [
            { title: { contains: search } },
            { composer: { contains: search } },
            { arranger: { contains: search } },
        ];
    }

    if (genre) {
        whereClause.genre = genre;
    }

    if (difficulty) {
        whereClause.difficulty = difficulty;
    }

    // Filter by bookmarks
    if (bookmarkedBy) {
        whereClause.bookmarks = {
            some: {
                userId: parseInt(bookmarkedBy),
            },
        };
    }

    // Sort mapping
    const sortMapping = {
        title: { title: 'asc' },
        composer: { composer: 'asc' },
        arranger: { arranger: 'asc' },
        genre: { genre: 'asc' },
        difficulty: { difficulty: 'asc' },
        createdAt: { createdAt: 'desc' },
    };

    const orderBy = sortMapping[sort] || { title: 'asc' };

    // Fetch sheet music with bookmarks (including user info for color assignment)
    const sheetMusic = await prisma.sheetMusic.findMany({
        where: whereClause,
        include: {
            bookmarks: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
        orderBy,
        skip,
        take,
    });

    // Get total count for pagination
    const total = await prisma.sheetMusic.count({ where: whereClause });

    res.json({
        sheetMusic,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    });
});

/**
 * Get sheet music by ID
 * GET /sheet-music/:id
 */
const getSheetMusicById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const sheetMusic = await prisma.sheetMusic.findUnique({
        where: { id: parseInt(id) },
        include: {
            bookmarks: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
    });

    if (!sheetMusic) {
        throw new AppError('Notenblatt nicht gefunden', 404);
    }

    res.json({ sheetMusic });
});

/**
 * Create new sheet music
 * POST /sheet-music
 */
const createSheetMusic = asyncHandler(async (req, res) => {
    const { title, composer, arranger, genre, difficulty, publisher, notes } = req.body;

    const sheetMusic = await prisma.sheetMusic.create({
        data: {
            title,
            composer,
            arranger,
            genre,
            difficulty,
            publisher,
            notes,
        },
    });

    res.status(201).json({
        message: 'Notenblatt erfolgreich erstellt',
        sheetMusic,
    });
});

/**
 * Update sheet music
 * PUT /sheet-music/:id
 */
const updateSheetMusic = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    const sheetMusic = await prisma.sheetMusic.update({
        where: { id: parseInt(id) },
        data: updateData,
    });

    res.json({
        message: 'Notenblatt erfolgreich aktualisiert',
        sheetMusic,
    });
});

/**
 * Delete sheet music
 * DELETE /sheet-music/:id
 */
const deleteSheetMusic = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.sheetMusic.delete({
        where: { id: parseInt(id) },
    });

    res.json({
        message: 'Notenblatt erfolgreich gelöscht',
    });
});

/**
 * Helper to parse CSV line respecting quotes
 */
const parseCsvLine = (line) => {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
                // Escaped quote
                currentValue += '"';
                i++; // Skip next quote
            } else {
                // Toggle quotes
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // End of value
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue.trim());
    return values;
};

/**
 * Import sheet music from CSV
 * POST /sheet-music/import-csv
 */
const importCsv = asyncHandler(async (req, res) => {
    const { mode, data } = req.body;

    // Split by newlines but handle potential newlines inside quotes
    const lines = data.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
        return res.json({
            message: 'Keine Daten gefunden',
            imported: 0,
            updated: 0,
            errors: 0,
            errorDetails: [],
        });
    }

    // Parse headers from first line
    const headerLine = lines[0];
    const headers = parseCsvLine(headerLine).map(h => h.toLowerCase());

    const importedSheets = [];
    const updatedSheets = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCsvLine(lines[i]);

            // Skip empty lines
            if (values.length === 1 && values[0] === '') continue;

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || null;
            });

            // Title is required
            if (!row.title) {
                errors.push({ line: i + 1, error: 'Titel fehlt' });
                continue;
            }

            // Validate difficulty if provided
            if (row.difficulty && !['easy', 'medium', 'hard'].includes(row.difficulty.toLowerCase())) {
                row.difficulty = null;
            } else if (row.difficulty) {
                row.difficulty = row.difficulty.toLowerCase();
            }

            const sheetData = {
                title: row.title,
                composer: row.composer || null,
                arranger: row.arranger || null,
                genre: row.genre || null,
                difficulty: row.difficulty || null,
                publisher: row.publisher || null,
                notes: row.notes || null,
            };

            if (mode === 'update') {
                const existing = await prisma.sheetMusic.findFirst({
                    where: {
                        title: {
                            equals: row.title,
                        },
                    },
                }) || await prisma.sheetMusic.findFirst({
                    where: {
                        title: row.title
                    }
                });

                if (existing) {
                    const updated = await prisma.sheetMusic.update({
                        where: { id: existing.id },
                        data: sheetData,
                    });
                    updatedSheets.push(updated);
                } else {
                    const created = await prisma.sheetMusic.create({
                        data: sheetData,
                    });
                    importedSheets.push(created);
                }
            } else {
                const created = await prisma.sheetMusic.create({
                    data: sheetData,
                });
                importedSheets.push(created);
            }
        } catch (error) {
            errors.push({ line: i + 1, error: error.message });
        }
    }

    res.json({
        message: 'CSV Import abgeschlossen',
        imported: importedSheets.length,
        updated: updatedSheets.length,
        errors: errors.length,
        errorDetails: errors,
    });
});

/**
 * Export sheet music to CSV
 * GET /sheet-music/export-csv
 */
const exportCsv = asyncHandler(async (req, res) => {
    const { search, genre, difficulty, bookmarkedBy } = req.query;

    const whereClause = {};

    if (search) {
        whereClause.OR = [
            { title: { contains: search } },
            { composer: { contains: search } },
            { arranger: { contains: search } },
        ];
    }

    if (genre) {
        whereClause.genre = genre;
    }

    if (difficulty) {
        whereClause.difficulty = difficulty;
    }

    if (bookmarkedBy) {
        whereClause.bookmarks = {
            some: {
                userId: parseInt(bookmarkedBy),
            },
        };
    }

    const sheetMusic = await prisma.sheetMusic.findMany({
        where: whereClause,
        orderBy: { title: 'asc' },
    });

    const headers = ['title', 'composer', 'arranger', 'genre', 'difficulty', 'publisher', 'notes'];

    // Add BOM for Excel
    let csv = '\uFEFF' + headers.join(',') + '\n';

    sheetMusic.forEach(sheet => {
        const row = headers.map(header => {
            let value = sheet[header];
            if (value === null || value === undefined) {
                return '';
            }
            value = value.toString();
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=sheet-music-export.csv');
    res.send(csv);
});

/**
 * Toggle bookmark for sheet music
 * POST /sheet-music/:id/bookmark
 */
const toggleBookmark = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const existingBookmark = await prisma.sheetMusicBookmark.findUnique({
        where: {
            userId_sheetMusicId: {
                userId,
                sheetMusicId: parseInt(id),
            },
        },
    });

    if (existingBookmark) {
        await prisma.sheetMusicBookmark.delete({
            where: {
                userId_sheetMusicId: {
                    userId,
                    sheetMusicId: parseInt(id),
                },
            },
        });

        res.json({
            message: 'Markierung entfernt',
            bookmarked: false,
        });
    } else {
        await prisma.sheetMusicBookmark.create({
            data: {
                userId,
                sheetMusicId: parseInt(id),
            },
        });

        res.json({
            message: 'Markierung hinzugefügt',
            bookmarked: true,
        });
    }
});


module.exports = {
    getAllSheetMusic,
    getSheetMusicById,
    createSheetMusic,
    updateSheetMusic,
    deleteSheetMusic,
    importCsv,
    exportCsv,
    toggleBookmark,
};
