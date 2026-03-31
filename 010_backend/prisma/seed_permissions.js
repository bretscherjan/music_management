const { PrismaClient } = require('@prisma/client');
const { seedPermissions } = require('../src/utils/permissions.seed');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding permissions...');
    const count = await seedPermissions(prisma);
    console.log(`✓ ${count} permissions seeded.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
