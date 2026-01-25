
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting folder migration...');

    // 1. Fetch all files that don't have a folderId yet
    const files = await prisma.file.findMany({
        where: {
            folderId: null,
        },
        select: {
            id: true,
            folder: true,
            filename: true
        }
    });

    console.log(`Found ${files.length} files to migrate.`);

    // 2. Process unique paths
    const uniquePaths = [...new Set(files.filter(f => f.folder).map(f => f.folder))];

    // Cache for created folder paths to IDs: { "/path/to/folder": id }
    const folderCache = {};

    // Ensure root folder exists if needed?
    // We'll treat "/" as NULL parent or a root folder? 
    // Let's create a root folder named "/" explicitly if we want to mimic the string.
    // OR we just map "/" to "Root" (id: ...).
    // Actually, usually "/" implies NO parent loop.
    // Let's iterate and build.

    const getOrCreateFolder = async (pathString) => {
        if (folderCache[pathString]) return folderCache[pathString];

        // normalize path: remove leading/trailing slashes
        const cleanPath = pathString.replace(/^\/+|\/+$/g, '');

        if (!cleanPath) {
            // It's the root "/"
            // Check if we have a root folder entry
            let root = await prisma.folder.findFirst({ where: { name: 'Root', parentId: null } });
            if (!root) {
                root = await prisma.folder.create({ data: { name: 'Root' } }); // Or "Dateien"
                console.log('Created Root folder');
            }
            folderCache[pathString] = root.id;
            return root.id;
        }

        const parts = cleanPath.split('/');
        let currentParentId = null;

        // Check/create root first if needed for hierarchy? or just top level folders?
        // If path is "Noten/Konzert", parent is "Noten", child is "Konzert".
        // "Noten" has parentId = null (or Root?).
        // Let's assume top level folders have parentId = null (or point to Root? Standard FS usually has a root).
        // Let's stick to: Top level folders have parentId = null. 
        // And if the file is at "/", it goes to a "Root" folder or stays with folderId=null (but we want to use the new system).
        // Let's map "/" to a "Root" folder to be consistent.

        // Better: let's try to find/create the hierarchy
        let currentPath = '';

        for (const part of parts) {
            // Find folder with this name and currentParentId
            let folder = await prisma.folder.findFirst({
                where: {
                    name: part,
                    parentId: currentParentId
                }
            });

            if (!folder) {
                folder = await prisma.folder.create({
                    data: {
                        name: part,
                        parentId: currentParentId
                    }
                });
                console.log(`Created folder: ${part} (parent: ${currentParentId})`);
            }
            currentParentId = folder.id;
        }

        folderCache[pathString] = currentParentId;
        return currentParentId;
    };

    // 3. Migrate files
    for (const file of files) {
        if (!file.folder) continue;

        try {
            const folderId = await getOrCreateFolder(file.folder);

            await prisma.file.update({
                where: { id: file.id },
                data: { folderId }
            });
            // process.stdout.write('.');
        } catch (e) {
            console.error(`Error migrating file ${file.id} (${file.filename}):`, e);
        }
    }

    console.log('\nMigration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
