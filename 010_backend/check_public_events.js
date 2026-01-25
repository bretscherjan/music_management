const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPublicEvents() {
    console.log('Checking for public events...');
    try {
        const publicEvents = await prisma.event.findMany({
            where: {
                isPublic: true,
            },
            select: {
                id: true,
                title: true,
                date: true,
                isPublic: true,
                visibility: true
            },
            orderBy: { date: 'asc' }
        });

        console.log(`Found ${publicEvents.length} public events:`);
        publicEvents.forEach(e => {
            console.log(`- [${e.id}] ${e.title} (${e.date.toISOString()}) Public: ${e.isPublic}`);
        });

        const futurePublic = publicEvents.filter(e => new Date(e.date) >= new Date());
        console.log(`Future public events (JS Filter): ${futurePublic.length}`);

    } catch (error) {
        console.error('Error querying events:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPublicEvents();
