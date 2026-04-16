const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Global search across files, folders, events, and members.
 * Results are strictly filtered by the requesting user's permissions
 * and the same visibility rules that exist on each domain's own endpoint.
 *
 * GET /api/search?q=<query>&category=all|files|folders|events|members
 */
const globalSearch = asyncHandler(async (req, res) => {
    const { q = '', category = 'all' } = req.query;
    const user = req.user;

    const query = q.trim();

    // Return empty results for blank / very short queries
    if (!query || query.length < 2) {
        return res.json({ files: [], folders: [], events: [], members: [] });
    }

    const isAdmin = user.role === 'admin';
    const hasPermission = (key) =>
        isAdmin || (user.permissions && user.permissions.some((p) => p.permission.key === key));

    const searchAll = category === 'all';
    const results = { files: [], folders: [], events: [], members: [] };

    // ─── FILES ───────────────────────────────────────────────────────────────
    if ((searchAll || category === 'files') && hasPermission('files:read')) {
        const fileWhere = {
            originalName: { contains: query },
        };

        if (!isAdmin) {
            // Mirror the same visibility rules as the existing file controller
            fileWhere.AND = [
                {
                    OR: [
                        { visibility: 'all' },
                        ...(user.registerId
                            ? [{ visibility: 'register', targetRegisterId: user.registerId }]
                            : []),
                        // 'limit' files: user must appear in an explicit ALLOW rule
                        {
                            visibility: 'limit',
                            accessRules: {
                                some: {
                                    accessType: 'ALLOW',
                                    OR: [
                                        { targetType: 'USER', userId: user.id },
                                        ...(user.registerId
                                            ? [{ targetType: 'REGISTER', registerId: user.registerId }]
                                            : []),
                                    ],
                                },
                            },
                        },
                    ],
                },
            ];
        }

        const files = await prisma.file.findMany({
            where: fileWhere,
            select: {
                id: true,
                originalName: true,
                mimetype: true,
                visibility: true,
                folder: true,
                folderId: true,
                createdAt: true,
            },
            take: 8,
            orderBy: { createdAt: 'desc' },
        });

        results.files = files;
    }

    // ─── FOLDERS ─────────────────────────────────────────────────────────────
    if ((searchAll || category === 'folders') && hasPermission('folders:read')) {
        const folderWhere = {
            name: { contains: query },
        };

        if (!isAdmin) {
            // Folders with no access rules are visible to all authenticated users.
            // Folders with explicit rules: user must be in an ALLOW rule.
            folderWhere.OR = [
                { accessRules: { none: {} } },
                {
                    accessRules: {
                        some: {
                            accessType: 'ALLOW',
                            OR: [
                                { targetType: 'USER', userId: user.id },
                                ...(user.registerId
                                    ? [{ targetType: 'REGISTER', registerId: user.registerId }]
                                    : []),
                            ],
                        },
                    },
                },
            ];
        }

        const folders = await prisma.folder.findMany({
            where: folderWhere,
            select: {
                id: true,
                name: true,
                parentId: true,
                createdAt: true,
            },
            take: 8,
            orderBy: { name: 'asc' },
        });

        results.folders = folders;
    }

    // ─── EVENTS ──────────────────────────────────────────────────────────────
    if ((searchAll || category === 'events') && hasPermission('events:read')) {
        const eventWhere = {
            OR: [
                { title: { contains: query } },
                { description: { contains: query } },
                { location: { contains: query } },
            ],
        };

        if (!isAdmin) {
            // Mirror the event visibility logic from event.controller.js
            const registerFilter = user.registerId
                ? { targetRegisters: { some: { id: user.registerId } } }
                : null;

            eventWhere.AND = [
                { visibility: { not: 'admin' } },
                {
                    OR: [
                        { targetRegisters: { none: {} } },
                        ...(registerFilter ? [registerFilter] : []),
                    ],
                },
            ];
        }

        const events = await prisma.event.findMany({
            where: eventWhere,
            select: {
                id: true,
                title: true,
                date: true,
                startTime: true,
                category: true,
                location: true,
                visibility: true,
            },
            take: 8,
            orderBy: { date: 'asc' },
        });

        results.events = events;
    }

    // ─── MEMBERS ─────────────────────────────────────────────────────────────
    if ((searchAll || category === 'members') && hasPermission('members:read')) {
        const nameParts = query.split(/\s+/).filter(Boolean);

        const memberWhere = {
            status: { not: 'former' },
            OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                // Match "first last" or "last first" two-word queries
                ...(nameParts.length === 2
                    ? [
                          {
                              AND: [
                                  { firstName: { contains: nameParts[0] } },
                                  { lastName: { contains: nameParts[1] } },
                              ],
                          },
                          {
                              AND: [
                                  { firstName: { contains: nameParts[1] } },
                                  { lastName: { contains: nameParts[0] } },
                              ],
                          },
                      ]
                    : []),
            ],
        };

        const members = await prisma.user.findMany({
            where: memberWhere,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                role: true,
                status: true,
                register: {
                    select: { id: true, name: true },
                },
            },
            take: 8,
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        });

        results.members = members;
    }

    return res.json(results);
});

module.exports = { globalSearch };
