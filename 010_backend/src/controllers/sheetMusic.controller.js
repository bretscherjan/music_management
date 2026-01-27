const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const PdfPrinter = require('pdfmake/js/Printer').default;
const path = require('path');
const fs = require('fs');

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
        folderId, // Filter by Folder
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

    // Filter by Folder
    if (folderId) {
        whereClause.folderItems = {
            some: {
                folderId: parseInt(folderId)
            }
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
            files: true, // Include associated files
        },
    });

    if (!sheetMusic) {
        throw new AppError('Notenblatt nicht gefunden', 404);
    }

    res.json({ sheetMusic });
});

/**
 * View Sheet Music PDF (Smart Proxy)
 * GET /sheet-music/:id/view
 */
const viewSheetMusicPdf = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const requestedFileId = req.query.fileId; // Optional specific file request

    // Fetch sheet music with files
    const sheetMusic = await prisma.sheetMusic.findUnique({
        where: { id: parseInt(id) },
        include: {
            files: true
        }
    });

    if (!sheetMusic) {
        throw new AppError('Notenblatt nicht gefunden', 404);
    }

    if (!sheetMusic.files || sheetMusic.files.length === 0) {
        throw new AppError('Keine Dateien für dieses Notenblatt vorhanden', 404);
    }

    let fileToServe = null;

    if (requestedFileId) {
        // Explicit request
        fileToServe = sheetMusic.files.find(f => f.id === parseInt(requestedFileId));
    } else {
        // Smart Selection Logic

        // 1. Try to find user's register part
        if (user.registerId) {
            fileToServe = sheetMusic.files.find(f => f.targetRegisterId === user.registerId);
        }

        // 2. If not found, try to find a file with NO targetRegister (Partitur/Score assumption)
        if (!fileToServe) {
            fileToServe = sheetMusic.files.find(f => !f.targetRegisterId);
        }

        // 3. Fallback: Take the first one? Or fail?
        if (!fileToServe) {
            fileToServe = sheetMusic.files[0];
        }
    }

    if (!fileToServe) {
        throw new AppError('Datei nicht gefunden', 404);
    }

    // Permission Check (reuse logic ideally, but simplified here)
    const hasAccess = await checkFileAccess(fileToServe, user);
    if (!hasAccess) {
        throw new AppError('Keine Berechtigung', 403);
    }

    // Serve File
    if (!fs.existsSync(fileToServe.path)) {
        throw new AppError('Datei physisch nicht gefunden', 404);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Inline for viewing in browser

    const stream = fs.createReadStream(fileToServe.path);
    stream.pipe(res);
});

// Helper for access check (Duplicated from file.controller because of module boundaries, 
// strictly should be in a service)
async function checkFileAccess(file, user) {
    if (user.role === 'admin') return true;

    // Check File Access Rules (We need to fetch them if we want full check)
    // The query above didn't fetch accessRules. Let's fetch the full file with rules.
    const fullFile = await prisma.file.findUnique({
        where: { id: file.id },
        include: { accessRules: true }
    });

    if (!fullFile) return false;

    // 1. Explicit DENY
    if (fullFile.accessRules.some(r => r.targetType === 'USER' && r.userId === user.id && r.accessType === 'DENY')) return false;
    if (user.registerId && fullFile.accessRules.some(r => r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'DENY')) return false;

    // 2. Explicit ALLOW
    if (fullFile.accessRules.some(r => r.targetType === 'USER' && r.userId === user.id && r.accessType === 'ALLOW')) return true;
    if (user.registerId && fullFile.accessRules.some(r => r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'ALLOW')) return true;

    // 3. Visibility Fallback
    const hasCustomRules = fullFile.accessRules.length > 0;
    if (!hasCustomRules) {
        if (fullFile.visibility === 'all') return true;
        if (fullFile.visibility === 'admin') return false;
        if (fullFile.visibility === 'register') return fullFile.targetRegisterId === user.registerId;
    }

    return false;
}

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
 * Export sheet music to PDF
 * GET /sheet-music/export-pdf
 */
const exportPdf = asyncHandler(async (req, res) => {
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

    // Define fonts - we'll use the ones from pdfmake package
    const fonts = {
        Roboto: {
            normal: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf'),
            bold: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf'),
            italics: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf'),
            bolditalics: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf')
        }
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
        pageOrientation: 'landscape',
        footer: function (currentPage, pageCount) {
            return {
                text: currentPage.toString() + ' / ' + pageCount,
                alignment: 'center',
                margin: [0, 10, 0, 0]
            };
        },
        content: [
            {
                text: 'Noteninventar der Musig Elgg',
                style: 'header',
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            {
                text: new Date().toLocaleDateString('de-CH'),
                alignment: 'right',
                margin: [0, 0, 0, 20]
            },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
                    body: [
                        [
                            { text: 'Titel', style: 'tableHeader' },
                            { text: 'Komponist', style: 'tableHeader' },
                            { text: 'Arrangeur', style: 'tableHeader' },
                            { text: 'Genre', style: 'tableHeader' },
                            { text: 'Schwierigkeit', style: 'tableHeader' },
                            { text: 'Verlag', style: 'tableHeader' },
                            { text: 'Bemerkungen', style: 'tableHeader' }
                        ],
                        ...sheetMusic.map(sheet => [
                            sheet.title || '',
                            sheet.composer || '',
                            sheet.arranger || '',
                            sheet.genre || '',
                            sheet.difficulty || '',
                            sheet.publisher || '',
                            sheet.notes || ''
                        ])
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true
            },
            tableHeader: {
                bold: true,
                fontSize: 12,
                color: 'black',
                fillColor: '#eeeeee'
            }
        },
        defaultStyle: {
            fontSize: 10
        }
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sheet-music-export.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end();
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
    exportPdf,
    toggleBookmark,
    viewSheetMusicPdf,
};
