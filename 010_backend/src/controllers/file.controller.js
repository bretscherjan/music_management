const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');
const { allowedMimeTypes } = require('../validations/file.validation');
const notificationService = require('../services/notification.service');
const fileTokenService = require('../services/fileToken.service');

const prisma = new PrismaClient();

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        const fullPath = path.join(process.cwd(), uploadDir);

        // Ensure directory exists
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }

        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        // Sanitize original filename for safe storage, but keep original for display
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(`Dateityp ${file.mimetype} ist nicht erlaubt`, 400), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    },
});

/**
 * Upload a file
 * POST /files/upload
 */
const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('Keine Datei hochgeladen', 400);
    }

    let { visibility = 'all', targetRegisterId, eventId, folderId, accessRules, sheetMusicId } = req.body;

    // Resolve folderId
    let resolvedFolderId = null;
    let resolvedFolderName = '/'; // fallback for folder string

    if (folderId && folderId !== 'null' && folderId !== 'undefined' && folderId !== 'root') {
        resolvedFolderId = parseInt(folderId);
        // Verify folder exists
        const folderObj = await prisma.folder.findUnique({ where: { id: resolvedFolderId } });
        if (!folderObj) throw new AppError('Ordner nicht gefunden', 404);
        resolvedFolderName = folderObj.name; // Not full path, but name. Or construct path? 
        // Existing system used FULL PATH strings.
        // New system keeps `folderId`.
        // We set `folderId` directly. The `folder` string field is deprecated but we can set it to the folder Name or '/' if root.
        // For compatibility, let's just use the Name or 'legacy' logic if we wanted. 
        // But we are migrating away from logic dependent on path string for hierarchy.
    } else {
        // Root folder logic
        // Try to find Root folder ID if we want to be strict, or just leave null
        // Migration script mapped '/' to Root folder.
        // If we want consistency, we should look up Root folder.
        const root = await prisma.folder.findFirst({ where: { name: 'Root', parentId: null } });
        if (root) {
            resolvedFolderId = root.id;
        }
    }

    // Validate targetRegisterId if provided
    if (targetRegisterId && targetRegisterId !== 'null') {
        const register = await prisma.register.findUnique({
            where: { id: parseInt(targetRegisterId) },
        });
        if (!register) {
            fs.unlinkSync(req.file.path);
            throw new AppError('Register nicht gefunden', 404);
        }
    }

    // Validate eventId if provided
    if (eventId && eventId !== 'null') {
        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
        });
        if (!event) {
            fs.unlinkSync(req.file.path);
            throw new AppError('Event nicht gefunden', 404);
        }
    }

    // Parse access rules if string
    let parsedAccessRules = [];
    if (accessRules) {
        try {
            parsedAccessRules = typeof accessRules === 'string' ? JSON.parse(accessRules) : accessRules;
        } catch (e) {
            console.error("Failed to parse access rules:", e);
        }
    }

    // Create file record
    const file = await prisma.file.create({
        data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            visibility,
            folder: resolvedFolderName, // Deprecated but filled
            folderId: resolvedFolderId, // New Relation
            targetRegisterId: targetRegisterId && targetRegisterId !== 'null' ? parseInt(targetRegisterId) : null,
            eventId: eventId && eventId !== 'null' ? parseInt(eventId) : null,
            sheetMusicId: sheetMusicId && sheetMusicId !== 'null' ? parseInt(sheetMusicId) : null,
            accessRules: {
                create: parsedAccessRules.map(rule => ({
                    accessType: rule.accessType,
                    targetType: rule.targetType,
                    userId: rule.userId ? parseInt(rule.userId) : null,
                    registerId: rule.registerId ? parseInt(rule.registerId) : null
                }))
            }
        },
        include: {
            accessRules: true
        }
    });

    notificationService.notifyFileUploaded(file);

    res.status(201).json({
        message: 'Datei erfolgreich hochgeladen',
        file: {
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            mimetype: file.mimetype,
            size: file.size,
            visibility: file.visibility,
            accessRules: file.accessRules,
            createdAt: file.createdAt,
        },
    });
});

/**
 * Get file by ID (protected download)
 * GET /files/:id
 */
const getFileById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const file = await prisma.file.findUnique({
        where: { id: parseInt(id) },
        include: {
            targetRegister: true,
            event: true,
            accessRules: true,
        },
    });

    if (!file) {
        throw new AppError('Datei nicht gefunden', 404);
    }

    // Check access permissions
    const hasAccess = checkFileAccess(file, user);

    if (!hasAccess) {
        throw new AppError('Keine Berechtigung für diese Datei', 403);
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
        console.error(`[DEBUG] File not found on disk. ID: ${id}, Path: ${file.path}`);
        // Log error but don't delete from DB here, let admin handle it or lazy cleanup?
        // Better validation:
        throw new AppError('Datei nicht auf dem Server gefunden', 404);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', file.size);

    // Stream file to response
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
});

/**
 * Get file metadata by ID
 * GET /files/:id/info
 */
const getFileInfo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const file = await prisma.file.findUnique({
        where: { id: parseInt(id) },
        include: {
            targetRegister: {
                select: { id: true, name: true },
            },
            event: {
                select: { id: true, title: true },
            },
            accessRules: true,
        },
    });

    if (!file) {
        throw new AppError('Datei nicht gefunden', 404);
    }

    // Check access permissions
    const hasAccess = checkFileAccess(file, user);

    if (!hasAccess) {
        throw new AppError('Keine Berechtigung für diese Datei', 403);
    }

    res.json({
        file: {
            id: file.id,
            originalName: file.originalName,
            mimetype: file.mimetype,
            size: file.size,
            visibility: file.visibility,
            targetRegister: file.targetRegister,
            event: file.event,
            accessRules: file.accessRules,
            createdAt: file.createdAt,
        },
    });
});

/**
 * Get all files (filtered by user permissions)
 * GET /files
 */
const getAllFiles = asyncHandler(async (req, res) => {
    const { visibility, eventId, registerId, folder, sheetMusicId } = req.query;
    const user = req.user;

    // Base query
    const whereClause = {
        originalName: {
            not: '.folder_init'
        }
    };

    // Filter by eventId if provided
    if (eventId) {
        whereClause.eventId = parseInt(eventId);
    }

    // Filter by registerId if provided (legacy filter)
    if (registerId) {
        whereClause.targetRegisterId = parseInt(registerId);
    }

    if (sheetMusicId) {
        whereClause.sheetMusicId = parseInt(sheetMusicId);
    }

    // Filter by folder if provided
    if (folder !== undefined) {
        whereClause.folder = String(folder).trim();
    }

    // Fetch files with necessary relations for permission checking
    const files = await prisma.file.findMany({
        where: whereClause,
        select: {
            id: true,
            originalName: true,
            mimetype: true,
            size: true,
            visibility: true,
            folder: true,
            targetRegisterId: true,
            targetRegister: {
                select: { id: true, name: true },
            },
            event: {
                select: { id: true, title: true },
            },
            accessRules: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    // Filter files in memory based on complex access rules
    const visibleFiles = files.filter(file => checkFileAccess(file, user));

    res.json({
        files: visibleFiles,
        count: visibleFiles.length,
    });
});

/**
 * Delete file (Admin)
 * DELETE /files/:id
 */
const deleteFile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
        where: { id: parseInt(id) },
    });

    if (!file) {
        throw new AppError('Datei nicht gefunden', 404);
    }

    // Attempt to delete file from disk
    if (file.path) {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            } else {
                console.warn(`File to delete not found on disk: ${file.path}`);
            }
        } catch (err) {
            console.error(`Error deleting file from disk: ${err.message}`);
            // Proceed with DB deletion regardless, to clean up state
        }
    }

    // Delete database record
    await prisma.file.delete({
        where: { id: parseInt(id) },
    });

    if (file) {
        notificationService.notifyFileDeleted(file);
    }

    res.json({
        message: 'Datei erfolgreich gelöscht',
    });
});

/**
 * Helper function to check file access permissions with new FileAccess system
 */
function checkFileAccess(file, user) {
    if (!user) return false;

    // Admins have access to everything
    if (user.role === 'admin') return true;

    // 1. Check for Explicit DENY on User
    const userDeny = file.accessRules?.find(r =>
        r.targetType === 'USER' && r.userId === user.id && r.accessType === 'DENY'
    );
    if (userDeny) return false;

    // 2. Check for Explicit DENY on User's Register
    if (user.registerId) {
        const registerDeny = file.accessRules?.find(r =>
            r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'DENY'
        );
        if (registerDeny) return false;
    }

    // 3. Check for Explicit ALLOW on User
    const userAllow = file.accessRules?.find(r =>
        r.targetType === 'USER' && r.userId === user.id && r.accessType === 'ALLOW'
    );
    if (userAllow) return true;

    // 4. Check for Explicit ALLOW on User's Register
    if (user.registerId) {
        const registerAllow = file.accessRules?.find(r =>
            r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'ALLOW'
        );
        if (registerAllow) return true;
    }

    // 5. Fallback to legacy visibility ONLY if no custom access rules exist.
    // If there are custom rules (visibility = 'limit'), they take precedence.
    // We only reach this point if no ALLOW rule matched above.
    const hasCustomRules = (file.accessRules?.length ?? 0) > 0;

    if (!hasCustomRules) {
        // No custom rules, use legacy visibility
        if (file.visibility === 'all') return true;
        if (file.visibility === 'admin' && user.role !== 'admin') return false;
        if (file.visibility === 'register') {
            return file.targetRegisterId === user.registerId;
        }
    }

    // Default deny: custom rules exist but none matched, or visibility is restrictive
    return false;
}

/**
 * Get all unique folders
 * GET /files/folders
 */
const getFolders = asyncHandler(async (req, res) => {
    const user = req.user;

    // Get all files first to check permissions
    // Note: optimization possible with distinct query first, but checking permissions requires fetching rules
    // For now, fetch all files (metadata) and extract visible folders
    // This scales up to ~10k files reasonably. 

    const files = await prisma.file.findMany({
        select: {
            folder: true,
            visibility: true,
            targetRegisterId: true,
            accessRules: true,
        }
    });

    const visibleFolders = new Set();

    files.forEach(file => {
        // Optimization: if we already have this folder, we don't strictly need to check access to THIS file
        // BUT, we only want to show folders that contain AT LEAST ONE visible file for this user?
        // Or show all folders that exist? 
        // Usually, seeing a folder structure is fine, seeing content is restricted.
        // But let's apply strict visibility: folder visible if contains visible file.

        // Wait, if folder is completely empty, should it be shown? 
        // Current implementation derives folders from files. So strict visibility is natural behavior here.

        if (checkFileAccess(file, user)) {
            visibleFolders.add(file.folder);
        }
    });

    res.json({
        folders: Array.from(visibleFolders).sort(),
    });
});

/**
 * Delete folder and its contents (Admin)
 * DELETE /files/folders?folder=/path/to/folder
 */
const deleteFolder = asyncHandler(async (req, res) => {
    const { folder } = req.query;

    if (!folder || folder === '/') {
        throw new AppError('Ungültiger Ordnerpfad', 400);
    }

    // Validate folder path security (prevent accessing higher directories)
    if (folder.includes('..')) {
        throw new AppError('Ungültiger Pfad', 400);
    }

    // Find all files in this folder or subfolders
    const files = await prisma.file.findMany({
        where: {
            folder: {
                startsWith: folder
            }
        }
    });

    // Delete files from disk
    for (const file of files) {
        if (file.path) {
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (err) {
                console.error(`Failed to delete file ${file.path}:`, err);
            }
        }
    }

    // Delete files from database
    await prisma.file.deleteMany({
        where: {
            folder: {
                startsWith: folder
            }
        }
    });

    res.json({
        message: `Ordner "${folder}" und ${files.length} Dateien erfolgreich gelöscht`,
    });
});

/**
 * Create a new folder (by creating a placeholder file)
 * POST /files/create-folder
 */
const createFolder = asyncHandler(async (req, res) => {
    let { folder } = req.body;

    if (!folder || folder === '/') {
        throw new AppError('Bitte geben Sie einen Ordnernamen an', 400);
    }

    // Normalize
    folder = String(folder).replace(/\\/g, '/').trim();
    if (!folder.startsWith('/')) folder = '/' + folder;
    folder = folder.replace(/\/+$/, '') || '/';

    // Check if folder already exists (has any files)
    const existing = await prisma.file.findFirst({
        where: { folder }
    });

    if (existing) {
        throw new AppError('Ordner existiert bereits', 400);
    }

    // Create placeholder file
    const placeholderName = '.folder_init';
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const fullPath = path.join(process.cwd(), uploadDir, `${Date.now()}_init`);

    // Create physical dummy file
    fs.writeFileSync(fullPath, '');

    await prisma.file.create({
        data: {
            filename: path.basename(fullPath),
            originalName: placeholderName,
            path: fullPath,
            mimetype: 'application/x-directory',
            size: 0,
            visibility: 'all', // Folders are generally visible, content is restricted
            folder: folder,
        }
    });

    res.status(201).json({ message: 'Ordner erstellt', folder });
});

/**
 * Update file access rules
 * PUT /files/:id/access
 */
const updateFileAccess = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { visibility, accessRules, targetRegisterId } = req.body;

    const file = await prisma.file.findUnique({
        where: { id: parseInt(id) },
        include: { accessRules: true }
    });

    if (!file) {
        throw new AppError('Datei nicht gefunden', 404);
    }

    // Parse access rules
    let parsedAccessRules = [];
    if (accessRules) {
        try {
            parsedAccessRules = typeof accessRules === 'string' ? JSON.parse(accessRules) : accessRules;
        } catch (e) {
            console.error("Failed to parse access rules:", e);
        }
    }

    // Transaction to update file and replace rules
    const updatedFile = await prisma.$transaction(async (tx) => {
        // 1. Delete existing rules
        await tx.fileAccess.deleteMany({
            where: { fileId: parseInt(id) }
        });

        // 2. Update file metadata and create new rules
        return await tx.file.update({
            where: { id: parseInt(id) },
            data: {
                visibility: visibility || file.visibility,
                targetRegisterId: targetRegisterId ? parseInt(targetRegisterId) : null,
                accessRules: {
                    create: parsedAccessRules.map(rule => ({
                        accessType: rule.accessType,
                        targetType: rule.targetType,
                        userId: rule.userId ? parseInt(rule.userId) : null,
                        registerId: rule.registerId ? parseInt(rule.registerId) : null
                    }))
                }
            },
            include: { accessRules: true }
        });
    });

    res.json({
        message: 'Berechtigungen aktualisiert',
        file: updatedFile
    });
});

/**
 * Generate a one-time view token for a file
 * POST /files/:id/view-token
 */
const generateViewToken = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const file = await prisma.file.findUnique({
        where: { id: parseInt(id) },
        include: { accessRules: true } // Need access rules for permission check
    });

    if (!file) {
        throw new AppError('Datei nicht gefunden', 404);
    }

    // Check permissions
    const hasAccess = checkFileAccess(file, user);
    if (!hasAccess) {
        throw new AppError('Keine Berechtigung für diese Datei', 403);
    }

    const token = await fileTokenService.generateToken(file.id, user.id);

    // Construct public URL
    // Assume frontend can handle the full link or just return the token + relative path
    // Let's return the full public API URL
    const apiUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}/api`;
    const publicUrl = `${apiUrl}/public/files/${token}`;

    res.json({
        token,
        url: publicUrl,
        expiresIn: 10 * 60 // 10 minutes in seconds
    });
});

module.exports = {
    upload,
    uploadFile,
    getFileById,
    getFileInfo,
    getAllFiles,
    deleteFile,
    updateFileAccess,
    getFolders,
    createFolder,
    deleteFolder,
    generateViewToken,
};
