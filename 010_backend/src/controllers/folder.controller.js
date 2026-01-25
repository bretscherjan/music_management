const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

// Helper to check folder access
const checkFolderAccess = (folder, user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const { accessRules } = folder;
    if (!accessRules || accessRules.length === 0) return true; // Default allow for members

    // Check for ADMIN_ONLY rule - if present, deny non-admins
    const adminOnlyRule = accessRules.find(r => r.targetType === 'ADMIN_ONLY');
    if (adminOnlyRule) return false;

    // 1. Explicit Deny
    const userDeny = accessRules.find(r => r.targetType === 'USER' && r.userId === user.id && r.accessType === 'DENY');
    if (userDeny) return false;

    if (user.registerId) {
        const regDeny = accessRules.find(r => r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'DENY');
        if (regDeny) return false;
    }

    // 2. Explicit Allow
    const userAllow = accessRules.find(r => r.targetType === 'USER' && r.userId === user.id && r.accessType === 'ALLOW');
    if (userAllow) return true;

    if (user.registerId) {
        const regAllow = accessRules.find(r => r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'ALLOW');
        if (regAllow) return true;
    }

    // 3. Fallback: If rules exist (e.g. "Only Trumpets"), and I'm not in allow list -> Deny
    // If rules only contain DENY rules, and I'm not denied -> Allow?
    // Logic: If there is at least one ALLOW rule, it becomes "Allowlist" mode (others denied).
    // If there are only DENY rules, it's "Blocklist" mode (others allowed).
    const hasAllowRules = accessRules.some(r => r.accessType === 'ALLOW');
    if (hasAllowRules) return false;

    return true;
};

// Helper to check file access permissions
const checkFileAccess = (file, user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const { accessRules } = file;

    // Check for ADMIN_ONLY rule - if present, deny non-admins
    const adminOnlyRule = accessRules?.find(r => r.targetType === 'ADMIN_ONLY');
    if (adminOnlyRule) return false;

    // 1. Explicit Deny on User
    const userDeny = accessRules?.find(r => r.targetType === 'USER' && r.userId === user.id && r.accessType === 'DENY');
    if (userDeny) return false;

    // 2. Explicit Deny on Register
    if (user.registerId) {
        const regDeny = accessRules?.find(r => r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'DENY');
        if (regDeny) return false;
    }

    // 3. Explicit Allow on User
    const userAllow = accessRules?.find(r => r.targetType === 'USER' && r.userId === user.id && r.accessType === 'ALLOW');
    if (userAllow) return true;

    // 4. Explicit Allow on Register
    if (user.registerId) {
        const regAllow = accessRules?.find(r => r.targetType === 'REGISTER' && r.registerId === user.registerId && r.accessType === 'ALLOW');
        if (regAllow) return true;
    }

    // 5. Fallback to legacy visibility if no custom rules
    const hasCustomRules = (accessRules?.length ?? 0) > 0;
    if (!hasCustomRules) {
        if (file.visibility === 'all') return true;
        if (file.visibility === 'admin') return false;
        if (file.visibility === 'register') {
            return file.targetRegisterId === user.registerId;
        }
        return true; // Default allow if no rules and no visibility set
    }

    // Has custom rules but none matched -> check if allowlist mode
    const hasAllowRules = accessRules.some(r => r.accessType === 'ALLOW');
    if (hasAllowRules) return false; // Allowlist mode, not in list -> deny

    return true; // Only deny rules exist, not denied -> allow
};

/**
 * Create a new folder
 * POST /folders
 */
const createFolder = asyncHandler(async (req, res) => {
    const { name, parentId } = req.body;

    if (!name) throw new AppError('Name erforderlich', 400);

    const existing = await prisma.folder.findFirst({
        where: {
            name,
            parentId: parentId ? parseInt(parentId) : null
        }
    });

    if (existing) throw new AppError('Ordner existiert bereits', 400);

    const folder = await prisma.folder.create({
        data: {
            name,
            parentId: parentId ? parseInt(parentId) : null
        }
    });

    res.status(201).json({ folder });
});

/**
 * Get folder contents (subfolders and files)
 * GET /folders/:id/contents
 */
/**
 * Get folder contents (subfolders and files)
 * GET /folders/:id/contents
 */
const getFolderContents = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const folderId = id === 'root' ? null : parseInt(id);

    let currentFolderObj = null;
    let breadcrumbs = [];

    // If requesting specific folder, check its existence and permissions
    if (folderId !== null) {
        currentFolderObj = await prisma.folder.findUnique({
            where: { id: folderId },
            include: { accessRules: true }
        });
        if (!currentFolderObj) throw new AppError('Ordner nicht gefunden', 404);
        if (!checkFolderAccess(currentFolderObj, user)) throw new AppError('Keine Berechtigung', 403);

        // Build breadcrumbs
        let tempBreadcrumbs = [];

        // Add current folder (optional, usually breadcrumb excludes current or includes it at end)
        // Let's include current as the last item
        tempBreadcrumbs.unshift({ id: currentFolderObj.id, name: currentFolderObj.name });

        let currentParentCrawl = currentFolderObj.parentId; // Start looking for parent of current

        // Loop to find parents
        while (currentParentCrawl !== null && currentParentCrawl !== undefined) {
            const p = await prisma.folder.findUnique({ where: { id: currentParentCrawl } });
            if (p) {
                tempBreadcrumbs.unshift({ id: p.id, name: p.name });
                currentParentCrawl = p.parentId;
            } else {
                break;
            }
        }
        breadcrumbs = tempBreadcrumbs;
    }

    let whereFolder = {};
    let whereFile = {};

    if (folderId === null) {
        // Root level: show folders with parentId=null, but EXCLUDE the "Root" folder itself
        const rootFolder = await prisma.folder.findFirst({ where: { name: 'Root', parentId: null } });

        if (rootFolder) {
            // Exclude the root folder from being listed as a subfolder of itself
            whereFolder = { parentId: null, NOT: { id: rootFolder.id } };
            whereFile = { folderId: rootFolder.id };
        } else {
            // No Root folder exists, just show folders with parentId=null
            whereFolder = { parentId: null };
            whereFile = { folderId: null };
        }
    } else {
        whereFolder = { parentId: folderId };
        whereFile = { folderId: folderId };
    }

    const folders = await prisma.folder.findMany({
        where: whereFolder,
        include: { accessRules: true, _count: { select: { files: true, children: true } } },
        orderBy: { name: 'asc' }
    });

    const files = await prisma.file.findMany({
        where: whereFile,
        include: { accessRules: true },
        orderBy: { originalName: 'asc' }
    });

    // Filter by permissions
    const visibleFolders = folders.filter(f => checkFolderAccess(f, user));

    // Filter files by access rules
    const visibleFiles = files.filter(f => checkFileAccess(f, user));

    res.json({
        folders: visibleFolders,
        files: visibleFiles,
        breadcrumbs,
        currentFolder: currentFolderObj
            ? { id: currentFolderObj.id, name: currentFolderObj.name, parentId: currentFolderObj.parentId }
            : { id: null, name: 'Root', parentId: null }
    });
});

/**
 * Update folder (Permissions / Rename)
 * PUT /folders/:id
 */
const updateFolder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, parentId, accessRules } = req.body;

    // Check existence
    const folder = await prisma.folder.findUnique({ where: { id: parseInt(id) } });
    if (!folder) throw new AppError('Ordner nicht gefunden', 404);

    const updateData = {};
    if (name) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId ? parseInt(parentId) : null;

    if (accessRules) {
        // Replace access rules
        // accessRules: [{ accessType: 'ALLOW', targetType: 'REGISTER', registerId: 1 }, ...]
        updateData.accessRules = {
            deleteMany: {},
            create: accessRules.map(r => ({
                accessType: r.accessType,
                targetType: r.targetType,
                userId: r.userId,
                registerId: r.registerId
            }))
        };
    }

    const updated = await prisma.folder.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { accessRules: true }
    });

    res.json({ folder: updated });
});

/**
 * Delete folder
 * DELETE /folders/:id
 */
const deleteFolder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Recursive delete is handled by Cascade in Prisma usually?
    // Schema: onDelete: Cascade for children and files?
    // Folder -> children (Cascade) - YES.
    // Folder -> files (SetNull or Cascade?)
    // Schema says: `realFolder Folder? @relation(..., onDelete: SetNull)` for File.
    // So deleting a folder sets `folderId` to null on files (moves them to root/orphan).
    // The user probably wants to delete contents too?
    // "Delete folder and its contents"
    // If we want to delete contents, we must delete files explicitly.

    // Find all files recursively? Or just strictly in this folder?
    // If we rely on Cascade for subfolders, we just need to delete files in this tree.
    // It's recursive.

    // Easier approach: Delete the folder. If Schema set to Cascade for Files (Wait, Schema said SetNull).
    // I should change Schema to Cascade for Files if I want them deleted? 
    // Or handle deletion manually.
    // Manual:
    // 1. Find all subfolders (recursive ID fetch).
    // 2. Delete all files in these folder IDs.
    // 3. Delete the folder (Cascade children).

    // Let's implement simple "Delete Folder" which deletes the folder. 
    // If files become orphaned, that's maybe safer? 
    // User said "admin can add folders...". Delete wasn't specified but implied.

    await prisma.folder.delete({
        where: { id: parseInt(id) }
    });

    res.json({ message: 'Ordner gelöscht' });
});

module.exports = {
    createFolder,
    getFolderContents,
    updateFolder,
    deleteFolder
};
