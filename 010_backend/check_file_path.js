const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const file = await prisma.file.findUnique({
        where: { id: 22 },
        select: { id: true, filename: true, path: true }
    });
    console.log(file);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
