const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const permissions = [
    { key: 'calendar:read', description: 'Termine einsehen', category: 'Kalender' },
    { key: 'calendar:write', description: 'Termine erstellen und bearbeiten', category: 'Kalender' },
    { key: 'sheetMusic:read', description: 'Noten einsehen', category: 'Noten' },
    { key: 'sheetMusic:write', description: 'Noten verwalten', category: 'Noten' },
    { key: 'files:read', description: 'Dateien einsehen', category: 'Dateien' },
    { key: 'files:write', description: 'Dateien hochladen und verwalten', category: 'Dateien' },
    { key: 'cms:read', description: 'Öffentliche Inhalte einsehen', category: 'CMS' },
    { key: 'cms:write', description: 'Öffentliche Inhalte verwalten (News, Galerie, Sponsoren)', category: 'CMS' },
    { key: 'chat:read', description: 'Chats lesen', category: 'Chat' },
    { key: 'chat:write', description: 'Nachrichten schreiben und Chats erstellen', category: 'Chat' },
    { key: 'workspace:read', description: 'Interne Aufgaben und Notizen einsehen', category: 'Workspace' },
    { key: 'workspace:write', description: 'Interne Aufgaben und Notizen verwalten', category: 'Workspace' },
    { key: 'admin:access', description: 'Zugriff auf Admin-Bereich', category: 'Admin' },
];

async function main() {
    console.log('🌱 Seeding permissions...');

    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { key: p.key },
            update: {
                description: p.description,
                category: p.category
            },
            create: p
        });
    }

    console.log(`✓ ${permissions.length} permissions seeded.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
