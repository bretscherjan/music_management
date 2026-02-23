const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const file = await prisma.file.findUnique({
        where: { id: 22 },
        include: { accessRules: true }
    });
    console.log(JSON.stringify(file, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
