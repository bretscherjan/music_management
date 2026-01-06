import { prisma } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Checking users...');
    try {
        const users = await prisma.users.findMany({ take: 5 });
        console.log('Users found:', users.length);
        users.forEach((u: any) => console.log(`- ${u.Email} (${u.FirstName} ${u.LastName})`));

        // Update admin password to known 'password'
        const adminEmail = 'admin@musigelgg.ch';
        const hashed = await bcrypt.hash('password', 10);

        // Check if admin exists
        const admin = await prisma.users.findUnique({ where: { Email: adminEmail } });
        if (admin) {
            console.log(`Updating password for ${adminEmail}...`);
            await prisma.users.update({
                where: { Email: adminEmail },
                data: { PasswordHash: hashed }
            });
            console.log('Admin password updated to "password".');
        } else {
            console.log('Admin user not found, creating...');
            await prisma.users.create({
                data: {
                    Email: adminEmail,
                    PasswordHash: hashed,
                    FirstName: 'Admin',
                    LastName: 'User',
                    IsActive: true,
                    UserRoles: {
                        create: {
                            Roles: {
                                connectOrCreate: {
                                    where: { Id: 1 }, // Assuming ID 1 is Admin or similar. Or find by Name.
                                    create: { Name: 'Admin', Level: 100 }
                                }
                            }
                        }
                    }
                }
            });
            console.log('Admin user created.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
