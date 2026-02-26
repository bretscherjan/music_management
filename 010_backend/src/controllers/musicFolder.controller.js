const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake/js/Printer').default;
const { FONTS, STYLES, DEFAULT_STYLE, parseOpts, buildTitleBlock, buildHeaderFooter } = require('../utils/pdfStyles');

const prisma = new PrismaClient();

/**
 * Get all music folders
 * GET /api/music-folders
 */
const getAllMusicFolders = asyncHandler(async (req, res) => {
    const folders = await prisma.musicFolder.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { items: true }
            }
        }
    });

    res.json(folders);
});

/**
 * Get music folder by ID with items
 * GET /api/music-folders/:id
 */
const getMusicFolderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const folder = await prisma.musicFolder.findUnique({
        where: { id: parseInt(id) },
        include: {
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: {
                        include: {
                            files: true // We need file info to show if parts exist
                        }
                    }
                }
            }
        }
    });

    if (!folder) {
        throw new AppError('Mappe nicht gefunden', 404);
    }

    res.json(folder);
});

/**
 * Create new music folder
 * POST /api/music-folders
 */
const createMusicFolder = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const folder = await prisma.musicFolder.create({
        data: {
            name,
            description
        }
    });

    res.status(201).json(folder);
});

/**
 * Update music folder metadata
 * PUT /api/music-folders/:id
 */
const updateMusicFolder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const folder = await prisma.musicFolder.update({
        where: { id: parseInt(id) },
        data: {
            name,
            description
        }
    });

    res.json(folder);
});

/**
 * Delete music folder
 * DELETE /api/music-folders/:id
 */
const deleteMusicFolder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.musicFolder.delete({
        where: { id: parseInt(id) }
    });

    res.json({ message: 'Mappe gelöscht' });
});

/**
 * Set folder items (Full sync/reorder)
 * POST /api/music-folders/:id/items
 * Body: { sheetMusicIds: [1, 5, 2] } // IDs in order
 */
const setFolderItems = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { sheetMusicIds } = req.body; // Array of sheetMusic IDs in order

    if (!Array.isArray(sheetMusicIds)) {
        throw new AppError('Invalid data format', 400);
    }

    // Use transaction to cleanup and re-insert
    await prisma.$transaction(async (tx) => {
        // 1. Delete all existing items for this folder
        await tx.musicFolderItem.deleteMany({
            where: { folderId: parseInt(id) }
        });

        // 2. Insert new items with order
        if (sheetMusicIds.length > 0) {
            await tx.musicFolderItem.createMany({
                data: sheetMusicIds.map((sheetId, index) => ({
                    folderId: parseInt(id),
                    sheetMusicId: sheetId,
                    position: index
                }))
            });
        }
    });

    // Return updated folder structure
    const updatedFolder = await prisma.musicFolder.findUnique({
        where: { id: parseInt(id) },
        include: {
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: true
                }
            }
        }
    });

    res.json(updatedFolder);
});

/**
 * Export Folder as ZIP
 * GET /api/music-folders/:id/export-zip
 */
const exportFolderZip = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user; // Assuming auth middleware populates this

    // 1. Fetch folder and items
    const folder = await prisma.musicFolder.findUnique({
        where: { id: parseInt(id) },
        include: {
            items: {
                include: {
                    sheetMusic: {
                        include: {
                            files: true
                        }
                    }
                }
            }
        }
    });

    if (!folder) {
        throw new AppError('Mappe nicht gefunden', 404);
    }

    // 2. Prepare Archive
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // Handle archive errors
    archive.on('error', function (err) {
        res.status(500).send({ error: err.message });
    });

    // Set headers
    const safeName = folder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.attachment(`${safeName}.zip`);

    // Pipe archive data to the response
    archive.pipe(res);

    // 3. Add files to archive
    // Logic: 
    // - Add Score (Partitur) always? Or maybe explicit flag? Usually YES.
    // - Add User's Register part if exists.
    // - If User is Admin, maybe add EVERYTHING? -> Requirement says "Speicherplatz sparen" -> Register specific.

    // User Register Logic (Simplified assumption based on Register model)
    // We need to know which file corresponds to which Instrument.
    // The File model doesn't strictly have "Instrument" type yet, 
    // but usually filenames or relation logic would help.
    // Since we didn't add "InstrumentType" to File, we have to guess or rely on 'originalName'.
    // OR we rely on `targetRegister` if that was used on the File.
    // Let's check Schema again: File has `targetRegisterId`.

    const userRegisterId = user.registerId;

    for (const item of folder.items) {
        const sheet = item.sheetMusic;
        if (!sheet.files || sheet.files.length === 0) continue;

        // Create a subfolder for each piece to be organized
        // Format: "01 - Rossini - William Tell"
        const prefix = item.position.toString().padStart(2, '0');
        const sheetName = `${prefix} - ${sheet.title}`.replace(/[\/\\:*?"<>|]/g, '_'); // Sanitize

        for (const file of sheet.files) {
            // Filter logic
            let include = false;

            // 1. If visible to ALL -> Include (e.g. Score if public) 
            // BUT usually Score is restricted.

            // 2. If targetRegisterId matches user's register -> Include
            if (file.targetRegisterId === userRegisterId) {
                include = true;
            }

            // 3. If file has NO targetRegisterId... it might be a Partitur or general file?
            // Let's assume files with NO targetRegisterId are "Partitur/Score" or valid for all.
            if (!file.targetRegisterId) {
                include = true;
            }

            // 4. If User is Admin -> Include All?
            if (user.role === 'admin') {
                include = true;
            }

            if (include) {
                // Check if file exists on disk
                if (fs.existsSync(file.path)) {
                    archive.file(file.path, { name: `${sheetName}/${file.originalName}` });
                }
            }
        }
    }

    await archive.finalize();
});

/**
 * Add items to folder (Append)
 * POST /api/music-folders/:id/add-items
 * Body: { sheetMusicIds: [1, 5] }
 */
const addFolderItems = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { sheetMusicIds } = req.body;

    if (!Array.isArray(sheetMusicIds)) {
        throw new AppError('Invalid data format', 400);
    }

    // Get current max position
    const currentMax = await prisma.musicFolderItem.findFirst({
        where: { folderId: parseInt(id) },
        orderBy: { position: 'desc' },
        select: { position: true }
    });

    let startPos = (currentMax?.position ?? -1) + 1;

    // Insert new items
    if (sheetMusicIds.length > 0) {
        // Filter out items that are already in the folder to avoid unique constraint errors?
        // Or just let it fail? Or skip?
        // Schema says: @@unique([folderId, sheetMusicId])
        // We should skip duplicates gracefully or fail.
        // Let's filter checking existing.

        const existing = await prisma.musicFolderItem.findMany({
            where: {
                folderId: parseInt(id),
                sheetMusicId: { in: sheetMusicIds }
            },
            select: { sheetMusicId: true }
        });

        const existingIds = new Set(existing.map(e => e.sheetMusicId));
        const newIds = sheetMusicIds.filter(sid => !existingIds.has(sid));

        if (newIds.length > 0) {
            await prisma.musicFolderItem.createMany({
                data: newIds.map((sheetId, index) => ({
                    folderId: parseInt(id),
                    sheetMusicId: sheetId,
                    position: startPos + index
                }))
            });
        }
    }

    // Return updated folder structure
    const updatedFolder = await prisma.musicFolder.findUnique({
        where: { id: parseInt(id) },
        include: {
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: true
                }
            }
        }
    });

    res.json(updatedFolder);
});


/**
 * Export Folder as PDF List
 * GET /api/music-folders/:id/export-pdf
 */
const exportFolderPdf = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const folder = await prisma.musicFolder.findUnique({
        where: { id: parseInt(id) },
        include: {
            items: {
                orderBy: { position: 'asc' },
                include: {
                    sheetMusic: true
                }
            }
        }
    });

    if (!folder) {
        throw new AppError('Mappe nicht gefunden', 404);
    }

    const opts = parseOpts(req.query);

    const fonts = FONTS;

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
        ...buildHeaderFooter('Musikmappe', opts),
        content: [
            ...buildTitleBlock(folder.name, folder.description || null, opts),
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto'],
                    body: [
                        [
                            { text: '#', style: 'tableHeader' },
                            { text: 'Titel', style: 'tableHeader' },
                            { text: 'Komponist', style: 'tableHeader' },
                            { text: 'Genre', style: 'tableHeader' }
                        ],
                        ...folder.items.map((item, index) => [
                            (index + 1).toString(),
                            item.sheetMusic.title,
                            item.sheetMusic.composer || '',
                            item.sheetMusic.genre || ''
                        ])
                    ]
                }
            }
        ],
        styles: STYLES,
        defaultStyle: DEFAULT_STYLE
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    // Sanitize filename
    const safeName = folder.name.replace(/[^a-z0-9]/gi, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
});

module.exports = {
    getAllMusicFolders,
    getMusicFolderById,
    createMusicFolder,
    updateMusicFolder,
    deleteMusicFolder,
    setFolderItems,
    addFolderItems,
    exportFolderZip,
    exportFolderPdf
};
