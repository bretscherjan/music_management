const { PrismaClient } = require('@prisma/client');
const { seedPermissions, assignDefaultPermissions } = require('./permissions.seed');

const prisma = new PrismaClient();

async function syncPermissionsForAllUsers() {
    console.log('Syncing permissions for all users...\n');

    // First seed permissions
    await seedPermissions();

    // Get all users
    const users = await prisma.user.findMany({
        select: { id: true, role: true },
    });

    console.log(`Found ${users.length} users.\n`);

    for (const user of users) {
        const role = user.role === 'admin' ? 'admin' : 'member';
        
        // Check if user already has permissions
        const existingPerms = await prisma.userPermission.count({
            where: { userId: user.id },
        });

        if (existingPerms > 0) {
            console.log(`[SKIP] User ${user.id} (${role}) already has ${existingPerms} permissions`);
        } else {
            await assignDefaultPermissions(user.id, role);
            console.log(`[ADD]   User ${user.id} (${role}) - default permissions assigned`);
        }
    }

    console.log('\nDone!');
}

syncPermissionsForAllUsers()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
