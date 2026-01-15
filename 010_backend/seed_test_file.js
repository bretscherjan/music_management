const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Check if test file exists
        const existing = await prisma.file.findFirst({
            where: { originalName: 'TestFile.txt' }
        });

        if (existing) {
            console.log('Test file already exists. ID:', existing.id);
            return;
        }

        // Create a dummy file record
        const file = await prisma.file.create({
            data: {
                filename: 'test-file-' + Date.now() + '.txt',
                originalName: 'TestFile.txt',
                path: 'uploads/dummy.txt', // Doesn't need to exist on disk for listing
                mimetype: 'text/plain',
                size: 1234,
                visibility: 'all',
                folder: '/TestFolder',
                createdAt: new Date(),
            }
        });

        console.log('Created test file with ID:', file.id);
        console.log('Folder:', file.folder);

    } catch (error) {
        console.error('Error creating test file:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
