const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.flyer.updateMany({
        where: {},
        data: { showOnHomePage: true, active: true }
    });
    console.log('Updated flyers:', updated.count);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
