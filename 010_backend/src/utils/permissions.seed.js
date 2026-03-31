const { PrismaClient } = require('@prisma/client');
const { PERMISSION_DEFINITIONS, SYSTEM_PERMISSION_TEMPLATES, expandPermissionKeys, getAllPermissionKeys, getDefaultPermissionKeys } = require('./permissions');

const prisma = new PrismaClient();

async function seedPermissions(prismaClient = prisma) {
    console.log('Seeding permissions...');

    const validPermissionKeys = getAllPermissionKeys();

    await prismaClient.permission.deleteMany({
        where: {
            key: {
                notIn: validPermissionKeys,
            },
        },
    });

    for (const perm of PERMISSION_DEFINITIONS) {
        await prismaClient.permission.upsert({
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

    const count = await prismaClient.permission.count();
    console.log(`Seeded ${count} permissions.`);

    return count;
}

async function seedPermissionTemplates(prismaClient = prisma) {
    for (const template of SYSTEM_PERMISSION_TEMPLATES) {
        await prismaClient.permissionTemplate.upsert({
            where: { systemKey: template.systemKey },
            update: {},
            create: {
                systemKey: template.systemKey,
                name: template.name,
                description: template.description,
                isSystem: template.isSystem,
                permissionKeys: expandPermissionKeys(template.permissionKeys),
            },
        });
    }

    return prismaClient.permissionTemplate.count();
}

async function assignDefaultPermissions(userId, userLike, options = {}) {
    const {
        grantedBy = null,
        prismaClient = prisma,
    } = options;

    const permissionKeys = getDefaultPermissionKeys(userLike);

    await seedPermissions(prismaClient);
    await seedPermissionTemplates(prismaClient);

    const permissionRecords = permissionKeys.length > 0
        ? await prismaClient.permission.findMany({
            where: { key: { in: permissionKeys } },
        })
        : [];

    await prismaClient.userPermission.deleteMany({ where: { userId } });

    if (permissionRecords.length > 0) {
        await prismaClient.userPermission.createMany({
            data: permissionRecords.map((permission) => ({
                userId,
                permissionId: permission.id,
                grantedBy,
            })),
        });
    }

    console.log(`Assigned ${permissionRecords.length} default permissions to user ${userId}`);

    return permissionRecords.map((permission) => permission.key);
}

async function syncMissingPermissionsForAllUsers(prismaClient = prisma) {
    await seedPermissions(prismaClient);
    await seedPermissionTemplates(prismaClient);

    const users = await prismaClient.user.findMany({
        select: { id: true, role: true, type: true },
    });

    let updatedUsers = 0;

    for (const user of users) {
        const existingPerms = await prismaClient.userPermission.count({
            where: { userId: user.id },
        });

        if (existingPerms > 0) {
            continue;
        }

        await assignDefaultPermissions(user.id, user, { prismaClient });
        updatedUsers += 1;
    }

    return {
        totalUsers: users.length,
        updatedUsers,
    };
}

if (require.main === module) {
    Promise.all([seedPermissions(), seedPermissionTemplates()])
        .then(() => prisma.$disconnect())
        .catch(e => {
            console.error(e);
            prisma.$disconnect();
            process.exit(1);
        });
}

module.exports = {
    seedPermissions,
    seedPermissionTemplates,
    assignDefaultPermissions,
    syncMissingPermissionsForAllUsers,
};
