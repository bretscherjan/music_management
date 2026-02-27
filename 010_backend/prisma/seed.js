/**
 * Seed Script für Vereinsverwaltung
 * Erstellt logische Testdaten für die Musik-Verein App
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    // ============================================
    // 1. REGISTER (Stimmen/Instrumentengruppen)
    // ============================================
    console.log('📋 Creating registers...');

    const registers = await Promise.all([
        prisma.register.upsert({
            where: { name: 'Sopran' },
            update: {},
            create: { name: 'Sopran' }
        }),
        prisma.register.upsert({
            where: { name: 'Alt' },
            update: {},
            create: { name: 'Alt' }
        }),
        prisma.register.upsert({
            where: { name: 'Tenor' },
            update: {},
            create: { name: 'Tenor' }
        }),
        prisma.register.upsert({
            where: { name: 'Bass' },
            update: {},
            create: { name: 'Bass' }
        }),
        prisma.register.upsert({
            where: { name: 'Dirigent' },
            update: {},
            create: { name: 'Dirigent' }
        }),
    ]);

    console.log(`  ✓ ${registers.length} registers created\n`);

    // ============================================
    // 2. USERS (Vereinsmitglieder)
    // ============================================
    console.log('👥 Creating users...');

    const hashedPassword = await bcrypt.hash('Test1234!', 10);
    const adminPassword = await bcrypt.hash('Admin1234!', 10);

    const users = await Promise.all([
        // Admin User
        prisma.user.upsert({
            where: { email: 'admin@musig-elgg.ch' },
            update: {},
            create: {
                email: 'admin@musig-elgg.ch',
                password: adminPassword,
                firstName: 'Max',
                lastName: 'Müller',
                status: 'active',
                role: 'admin',
                registerId: registers.find(r => r.name === 'Dirigent')?.id
            }
        }),
        // Sopran members
        prisma.user.upsert({
            where: { email: 'anna.meier@example.ch' },
            update: {},
            create: {
                email: 'anna.meier@example.ch',
                password: hashedPassword,
                firstName: 'Anna',
                lastName: 'Meier',
                status: 'active',
                role: 'member',
                registerId: registers.find(r => r.name === 'Sopran')?.id
            }
        }),
        prisma.user.upsert({
            where: { email: 'sandra.huber@example.ch' },
            update: {},
            create: {
                email: 'sandra.huber@example.ch',
                password: hashedPassword,
                firstName: 'Sandra',
                lastName: 'Huber',
                status: 'active',
                role: 'member',
                registerId: registers.find(r => r.name === 'Sopran')?.id
            }
        }),
        // Alt members
        prisma.user.upsert({
            where: { email: 'maria.keller@example.ch' },
            update: {},
            create: {
                email: 'maria.keller@example.ch',
                password: hashedPassword,
                firstName: 'Maria',
                lastName: 'Keller',
                status: 'active',
                role: 'member',
                registerId: registers.find(r => r.name === 'Alt')?.id
            }
        }),
        prisma.user.upsert({
            where: { email: 'eva.brunner@example.ch' },
            update: {},
            create: {
                email: 'eva.brunner@example.ch',
                password: hashedPassword,
                firstName: 'Eva',
                lastName: 'Brunner',
                status: 'passive',
                role: 'member',
                registerId: registers.find(r => r.name === 'Alt')?.id
            }
        }),
        // Tenor members
        prisma.user.upsert({
            where: { email: 'peter.schmid@example.ch' },
            update: {},
            create: {
                email: 'peter.schmid@example.ch',
                password: hashedPassword,
                firstName: 'Peter',
                lastName: 'Schmid',
                status: 'active',
                role: 'member',
                registerId: registers.find(r => r.name === 'Tenor')?.id
            }
        }),
        prisma.user.upsert({
            where: { email: 'hans.weber@example.ch' },
            update: {},
            create: {
                email: 'hans.weber@example.ch',
                password: hashedPassword,
                firstName: 'Hans',
                lastName: 'Weber',
                status: 'active',
                role: 'member',
                registerId: registers.find(r => r.name === 'Tenor')?.id
            }
        }),
        // Bass members
        prisma.user.upsert({
            where: { email: 'thomas.fischer@example.ch' },
            update: {},
            create: {
                email: 'thomas.fischer@example.ch',
                password: hashedPassword,
                firstName: 'Thomas',
                lastName: 'Fischer',
                status: 'active',
                role: 'member',
                registerId: registers.find(r => r.name === 'Bass')?.id
            }
        }),
        prisma.user.upsert({
            where: { email: 'daniel.steiner@example.ch' },
            update: {},
            create: {
                email: 'daniel.steiner@example.ch',
                password: hashedPassword,
                firstName: 'Daniel',
                lastName: 'Steiner',
                status: 'former',
                role: 'member',
                registerId: registers.find(r => r.name === 'Bass')?.id
            }
        }),
        // Extra member without register
        prisma.user.upsert({
            where: { email: 'lisa.berger@example.ch' },
            update: {},
            create: {
                email: 'lisa.berger@example.ch',
                password: hashedPassword,
                firstName: 'Lisa',
                lastName: 'Berger',
                status: 'active',
                role: 'member',
                registerId: null
            }
        }),
    ]);

    console.log(`  ✓ ${users.length} users created\n`);

    // ============================================
    // 3. EVENTS (Proben und Auftritte)
    // ============================================
    console.log('📅 Creating events...');

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twoMonths = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Clear existing events first
    await prisma.attendance.deleteMany({});
    await prisma.event.deleteMany({});

    const events = await Promise.all([
        // Regular weekly rehearsal
        prisma.event.create({
            data: {
                title: 'Wöchentliche Probe',
                description: 'Regelmässige Chorprobe jeden Mittwoch. Bitte Notenmaterial mitbringen.',
                location: 'Gemeindesaal Elgg',
                category: 'rehearsal',
                visibility: 'all',
                date: nextWeek,
                startTime: '19:30',
                endTime: '21:30',
                responseDeadlineHours: 48, // 2 days before
                isRecurring: false,
            }
        }),
        // Special rehearsal
        prisma.event.create({
            data: {
                title: 'Sonderprobe Weihnachtskonzert',
                description: 'Zusätzliche Probe für das Weihnachtskonzert. Alle Stimmen benötigt!',
                location: 'Gemeindesaal Elgg',
                category: 'rehearsal',
                visibility: 'all',
                date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
                startTime: '14:00',
                endTime: '17:00',
                responseDeadlineHours: 24, // 1 day before
                isRecurring: false
            }
        }),
        // Concert
        prisma.event.create({
            data: {
                title: 'Weihnachtskonzert 2026',
                description: 'Grosses Weihnachtskonzert in der Kirche Elgg. Einlass ab 18:30, Konzertbeginn 19:00.',
                location: 'Reformierte Kirche Elgg',
                category: 'performance',
                visibility: 'all',
                date: nextMonth,
                startTime: '19:00',
                endTime: '21:00',
                responseDeadlineHours: 168, // 7 days before
                isRecurring: false
            }
        }),
        // Register rehearsal (only for specific register)
        prisma.event.create({
            data: {
                title: 'Registerprobe Sopran/Alt',
                description: 'Spezielle Stimmprobe für Sopran und Alt.',
                location: 'Musikzimmer Schulhaus',
                category: 'rehearsal',
                visibility: 'register',
                date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
                startTime: '18:00',
                endTime: '19:00',
                responseDeadlineHours: 24, // 1 day before
                isRecurring: false
            }
        }),
        // Admin meeting
        prisma.event.create({
            data: {
                title: 'Vorstandssitzung',
                description: 'Quartalsmeeting des Vorstands. Traktanden werden per E-Mail verschickt.',
                location: 'Restaurant Sonne, Elgg',
                category: 'other',
                visibility: 'admin',
                date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
                startTime: '19:00',
                endTime: '21:00',
                responseDeadlineHours: 48, // 2 days before
                isRecurring: false
            }
        }),
        // Spring concert
        prisma.event.create({
            data: {
                title: 'Frühlingskonzert 2026',
                description: 'Gemeinsames Konzert mit dem Männerchor Hagenbuch.',
                location: 'Mehrzweckhalle Elgg',
                category: 'performance',
                visibility: 'all',
                date: twoMonths,
                startTime: '17:00',
                endTime: '19:00',
                responseDeadlineHours: 168, // 7 days before
                isRecurring: false
            }
        }),
        // General assembly
        prisma.event.create({
            data: {
                title: 'Generalversammlung',
                description: 'Jährliche Generalversammlung des Vereins. Stimmrecht für alle aktiven Mitglieder.',
                location: 'Gemeindesaal Elgg',
                category: 'other',
                visibility: 'all',
                date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000),
                startTime: '19:00',
                endTime: '22:00',
                responseDeadlineHours: 120, // 5 days before
                isRecurring: false
            }
        }),
    ]);

    console.log(`  ✓ ${events.length} events created\n`);

    // ============================================
    // 4. ATTENDANCES (Anwesenheiten)
    // ============================================
    console.log('✋ Creating attendances...');

    const activeUsers = users.filter(u => u.status === 'active');
    const attendanceData = [];

    // Create attendance for first few events
    for (const event of events.slice(0, 3)) {
        for (const user of activeUsers) {
            const statuses = ['yes', 'yes', 'yes', 'no', 'maybe'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            attendanceData.push({
                eventId: event.id,
                userId: user.id,
                status: randomStatus,
                comment: randomStatus === 'no' ? 'Bin leider verhindert' : null
            });
        }
    }

    await prisma.attendance.createMany({
        data: attendanceData,
        skipDuplicates: true
    });

    console.log(`  ✓ ${attendanceData.length} attendances created\n`);

    // ============================================
    // 5. NEWS (Neuigkeiten)
    // ============================================
    console.log('📰 Creating news...');

    const adminUser = users.find(u => u.role === 'admin');

    await prisma.news.deleteMany({});

    const news = await Promise.all([
        prisma.news.create({
            data: {
                title: 'Willkommen zur neuen Vereins-Website!',
                content: `Liebe Sängerinnen und Sänger,

Wir freuen uns, euch unsere neue Vereins-Website vorstellen zu dürfen! Ab sofort könnt ihr hier:

- **Proben und Auftritte** einsehen und eure Teilnahme melden
- **Noten und Dokumente** herunterladen
- **News und Updates** vom Vorstand lesen

Bei Fragen oder Problemen meldet euch bitte beim Vorstand.

Musikalische Grüsse,
Euer Vorstand`,
                authorId: adminUser.id
            }
        }),
        prisma.news.create({
            data: {
                title: 'Weihnachtskonzert - Wichtige Infos',
                content: `Liebe Chormitglieder,

Das Weihnachtskonzert rückt näher! Hier die wichtigsten Infos:

**Datum:** Siehe Kalender
**Besammlung:** 18:00 Uhr (für Einsingen)
**Kleidung:** Schwarz/Weiss (wie besprochen)

Bitte meldet eure Teilnahme so schnell wie möglich an!

Wer noch keine Noten hat, kann diese bei mir abholen.

Beste Grüsse,
Max`,
                authorId: adminUser.id
            }
        }),
        prisma.news.create({
            data: {
                title: 'Neue Notenmappen',
                content: `Hallo zusammen,

Die neuen Notenmappen sind eingetroffen! Bitte holt eure Mappe bei der nächsten Probe ab.

Kosten: CHF 15.- (wird vom Mitgliederbeitrag abgezogen)

Gruss,
Der Vorstand`,
                authorId: adminUser.id
            }
        }),
    ]);

    console.log(`  ✓ ${news.length} news articles created\n`);

    // ============================================
    // 6. GALLERY IMAGES (Galerie)
    // ============================================
    console.log('📸 Creating gallery images...');
    await prisma.galleryImage.deleteMany({});
    const galleryImages = await Promise.all([
        prisma.galleryImage.create({
            data: {
                filename: '1771967065109-689601002.png',
                title: 'Konzert in der Kirche',
                description: 'Ein wunderschöner Auftritt in der Kirche Elgg.',
                category: 'Konzert',
                active: true,
                position: 1
            }
        }),
        prisma.galleryImage.create({
            data: {
                filename: '1771969316035-923357339.jpg',
                title: 'Probe im Freien',
                description: 'Sommerprobe im Freien.',
                category: 'Probe',
                active: true,
                position: 2
            }
        })
    ]);
    console.log(`  ✓ ${galleryImages.length} gallery images created\n`);

    // ============================================
    // 7. SPONSORS (Sponsoren)
    // ============================================
    console.log('🤝 Creating sponsors...');
    await prisma.sponsor.deleteMany({});
    const sponsors = await Promise.all([
        prisma.sponsor.create({
            data: {
                name: 'Raiffeisenbank Elgg',
                logoUrl: '1771969441754-252423599.jpg',
                websiteUrl: 'https://www.raiffeisen.ch',
                active: true,
                position: 1,
                description: 'Hauptsponsor'
            }
        }),
        prisma.sponsor.create({
            data: {
                name: 'Metzgerei Meier',
                logoUrl: '1771970523833-567319145.jpg',
                websiteUrl: 'https://example.com',
                active: true,
                position: 2
            }
        }),
        prisma.sponsor.create({
            data: {
                name: 'Bäckerei Hug',
                logoUrl: '1771970532999-147509513.jpg',
                websiteUrl: 'https://example.com',
                active: true,
                position: 3
            }
        })
    ]);
    console.log(`  ✓ ${sponsors.length} sponsors created\n`);

    // ============================================
    // 8. FLYERS (Flyer & Werbung)
    // ============================================
    console.log('📄 Creating flyers...');
    await prisma.flyer.deleteMany({});
    const flyers = await Promise.all([
        prisma.flyer.create({
            data: {
                filename: '1771967765435-335777576.pdf',
                title: 'Frühlingskonzert Flyer',
                active: true,
                position: 1,
                showOnHomePage: true
            }
        }),
        prisma.flyer.create({
            data: {
                filename: '1771967766712-258804634.pdf',
                title: 'Weihnachtskonzert Flyer',
                active: true,
                position: 2,
                showOnHomePage: false
            }
        }),
        prisma.flyer.create({
            data: {
                filename: '1771967777714-191517848.pdf',
                title: 'Jubiläum Flyer',
                active: true,
                position: 3,
                showOnHomePage: false
            }
        }),
        prisma.flyer.create({
            data: {
                filename: '1771967782473-586388218.pdf',
                title: 'Mitgliederwerbung',
                active: true,
                position: 4,
                showOnHomePage: false
            }
        }),
        prisma.flyer.create({
            data: {
                filename: '1771967790700-422398543.pdf',
                title: 'Konzertprogramm',
                active: true,
                position: 5,
                showOnHomePage: false
            }
        }),
        prisma.flyer.create({
            data: {
                filename: '1771967820207-978050471.pdf',
                title: 'Sponsorenmappe',
                active: true,
                position: 6,
                showOnHomePage: false
            }
        }),
        prisma.flyer.create({
            data: {
                filename: '1771967828418-815901312.pdf',
                title: 'Vereinsausflug',
                active: true,
                position: 7,
                showOnHomePage: false
            }
        })
    ]);
    console.log(`  ✓ ${flyers.length} flyers created\n`);

    // ============================================
    // 9. FILES & FOLDERS (Interner Bereich)
    // ============================================
    console.log('📁 Creating folders and files...');
    await prisma.fileAccess.deleteMany({});
    await prisma.folderAccess.deleteMany({});
    await prisma.fileShareToken.deleteMany({});
    await prisma.file.deleteMany({});
    await prisma.folder.deleteMany({});

    const rootFolder = await prisma.folder.create({
        data: {
            name: 'Allgemeine Dokumente'
        }
    });

    const sheetMusicFolder = await prisma.folder.create({
        data: {
            name: 'Noten'
        }
    });

    const files = await Promise.all([
        prisma.file.create({
            data: {
                filename: '1770313851451-154564275.pdf',
                originalName: 'Statuten_2024.pdf',
                path: '1770313851451-154564275.pdf',
                mimetype: 'application/pdf',
                size: 8985,
                visibility: 'all',
                folder: '/Allgemeine Dokumente',
                folderId: rootFolder.id
            }
        }),
        prisma.file.create({
            data: {
                filename: '1770314058484-693106929.pdf',
                originalName: 'Jahresprogramm_2025.pdf',
                path: '1770314058484-693106929.pdf',
                mimetype: 'application/pdf',
                size: 48694,
                visibility: 'all',
                folder: '/Allgemeine Dokumente',
                folderId: rootFolder.id
            }
        }),
        prisma.file.create({
            data: {
                filename: '1770314066106-238352975.docx',
                originalName: 'Protokoll_GV_2024.docx',
                path: '1770314066106-238352975.docx',
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 17435,
                visibility: 'all',
                folder: '/Allgemeine Dokumente',
                folderId: rootFolder.id
            }
        }),
        prisma.file.create({
            data: {
                filename: '1770314081329-105309764.pdf',
                originalName: 'Ave_Verum_Corpus_Sopran.pdf',
                path: '1770314081329-105309764.pdf',
                mimetype: 'application/pdf',
                size: 300655,
                visibility: 'register',
                targetRegisterId: registers.find(r => r.name === 'Sopran')?.id,
                folder: '/Noten',
                folderId: sheetMusicFolder.id
            }
        }),
        prisma.file.create({
            data: {
                filename: '1770314157451-25151182.pdf',
                originalName: 'Ave_Verum_Corpus_Alt.pdf',
                path: '1770314157451-25151182.pdf',
                mimetype: 'application/pdf',
                size: 300655,
                visibility: 'register',
                targetRegisterId: registers.find(r => r.name === 'Alt')?.id,
                folder: '/Noten',
                folderId: sheetMusicFolder.id
            }
        }),
        prisma.file.create({
            data: {
                filename: '1770316554216-419034800.docx',
                originalName: 'Helferliste_Konzert.docx',
                path: '1770316554216-419034800.docx',
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 17435,
                visibility: 'admin',
                folder: '/Allgemeine Dokumente',
                folderId: rootFolder.id
            }
        }),
        prisma.file.create({
            data: {
                filename: '1770407426553-488092474.xlsx',
                originalName: 'Kostenabrechnung.xlsx',
                path: '1770407426553-488092474.xlsx',
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                size: 6529,
                visibility: 'admin',
                folder: '/Allgemeine Dokumente',
                folderId: rootFolder.id
            }
        })
    ]);
    console.log(`  ✓ 2 folders and ${files.length} files created\n`);

    // ============================================
    // 10. SHEET MUSIC & TASKS
    // ============================================
    console.log('🎵 Creating sheet music...');
    await prisma.sheetMusicBookmark.deleteMany({});
    await prisma.eventSheetMusic.deleteMany({});
    await prisma.musicFolderItem.deleteMany({});
    await prisma.musicFolder.deleteMany({});
    await prisma.sheetMusic.deleteMany({});

    const sheetMusics = await Promise.all([
        prisma.sheetMusic.create({
            data: {
                title: 'Ave Verum Corpus',
                composer: 'W.A. Mozart',
                genre: 'Klassik',
                difficulty: 'medium'
            }
        }),
        prisma.sheetMusic.create({
            data: {
                title: 'Hallelujah',
                composer: 'Leonard Cohen',
                arranger: 'Roger Emerson',
                genre: 'Pop',
                difficulty: 'easy'
            }
        })
    ]);

    // Link file to sheet music
    await prisma.file.update({
        where: { id: files[3].id },
        data: { sheetMusicId: sheetMusics[0].id }
    });
    await prisma.file.update({
        where: { id: files[4].id },
        data: { sheetMusicId: sheetMusics[0].id }
    });

    console.log(`  ✓ ${sheetMusics.length} sheet music entries created\n`);

    console.log('✅ Creating tasks...');
    await prisma.taskHistory.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.taskCategory.deleteMany({});

    const taskCategory = await prisma.taskCategory.create({
        data: {
            name: 'Konzertvorbereitung',
            color: '#ff0000',
            position: 1
        }
    });

    const tasks = await Promise.all([
        prisma.task.create({
            data: {
                title: 'Noten sortieren',
                description: 'Alle Noten für das Weihnachtskonzert sortieren.',
                priority: 'high',
                categoryId: taskCategory.id,
                createdById: adminUser.id,
            }
        }),
        prisma.task.create({
            data: {
                title: 'Stühle aufstellen',
                priority: 'medium',
                categoryId: taskCategory.id,
                createdById: adminUser.id,
            }
        })
    ]);
    console.log(`  ✓ ${tasks.length} tasks created\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${registers.length} Registers`);
    console.log(`   • ${users.length} Users`);
    console.log(`   • ${events.length} Events`);
    console.log(`   • ${attendanceData.length} Attendances`);
    console.log(`   • ${news.length} News`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔑 USER CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN:');
    console.log('  Email:    admin@musig-elgg.ch');
    console.log('  Password: Admin1234!');
    console.log('');
    console.log('MEMBERS (alle mit gleichem Passwort):');
    console.log('  Password: Test1234!');
    console.log('  Emails:');
    console.log('    - anna.meier@example.ch (Sopran, active)');
    console.log('    - sandra.huber@example.ch (Sopran, active)');
    console.log('    - maria.keller@example.ch (Alt, active)');
    console.log('    - eva.brunner@example.ch (Alt, passive)');
    console.log('    - peter.schmid@example.ch (Tenor, active)');
    console.log('    - hans.weber@example.ch (Tenor, active)');
    console.log('    - thomas.fischer@example.ch (Bass, active)');
    console.log('    - daniel.steiner@example.ch (Bass, former)');
    console.log('    - lisa.berger@example.ch (no register, active)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
