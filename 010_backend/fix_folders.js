const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start cleaning folder paths...');

    // Find all files
    const files = await prisma.file.findMany();
    let count = 0;

    for (const file of files) {
        if (file.folder !== '/' && file.folder.endsWith('/')) {
            const cleanFolder = file.folder.replace(/\/+$/, '');
            console.log(`Fixing file ${file.id}: "${file.folder}" -> "${cleanFolder}"`);

            await prisma.file.update({
                where: { id: file.id },
                data: { folder: cleanFolder }
            });
            count++;
        }
    }

    console.log(`Finished. Fixed ${count} files.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
