const { PrismaClient } = require('@prisma/client');
const { PERMISSION_DEFINITIONS } = require('./permissions');

const prisma = new PrismaClient();

async function seedPermissions() {
    console.log('Seeding permissions...');
    
    for (const perm of PERMISSION_DEFINITIONS) {
        await prisma.permission.upsert({
            where: { key: perm.key },
            update: {
                description: perm.description,
                category: perm.category,
            },
            create: {
                key: perm.key,
                description: perm.description,
                category: perm.category,
            },
        });
    }
    
    const count = await prisma.permission.count();
    console.log(`Seeded ${count} permissions.`);
}

async function assignDefaultPermissions(userId, role) {
    const { DEFAULT_PERMISSIONS } = require('./permissions');
    
    const permissions = role === 'admin' 
        ? DEFAULT_PERMISSIONS.admin 
        : DEFAULT_PERMISSIONS.regular;
    
    const permissionRecords = await prisma.permission.findMany({
        where: { key: { in: permissions } },
    });
    
    await prisma.userPermission.deleteMany({ where: { userId } });
    
    await prisma.userPermission.createMany({
        data: permissionRecords.map(p => ({
            userId,
            permissionId: p.id,
        })),
    });
    
    console.log(`Assigned default permissions to user ${userId} (${role})`);
}

if (require.main === module) {
    seedPermissions()
        .then(() => prisma.$disconnect())
        .catch(e => {
            console.error(e);
            prisma.$disconnect();
            process.exit(1);
        });
}

module.exports = { seedPermissions, assignDefaultPermissions };
