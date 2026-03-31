const { PrismaClient } = require('@prisma/client');
const { syncMissingPermissionsForAllUsers } = require('./permissions.seed');

const prisma = new PrismaClient();

async function syncPermissionsForAllUsers() {
    console.log('Syncing permissions for all users...\n');

    const result = await syncMissingPermissionsForAllUsers(prisma);

    console.log(`Found ${result.totalUsers} users.`);
    console.log(`Updated ${result.updatedUsers} users.`);

    console.log('\nDone!');
}

syncPermissionsForAllUsers()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
