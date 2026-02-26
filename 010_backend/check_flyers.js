const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const flyers = await prisma.flyer.findMany();
    console.log('Flyers in DB:', JSON.stringify(flyers, null, 2));
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
