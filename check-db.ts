import prisma from './src/lib/prisma';

async function run() {
    try {
        const legacyCount = await prisma.$queryRawUnsafe('SELECT count(*) FROM "LegacyMember"');
        const userCount = await prisma.user.count();
        const usersWithBirth = await prisma.user.count({ where: { NOT: { birthdate: null } } });
        const usersWithoutBirth = await prisma.user.count({ where: { birthdate: null } });
        
        console.log({
            legacyTableCount: (legacyCount as any)[0].count,
            totalUsersInNewDB: userCount,
            usersWithBirthInNewDB: usersWithBirth,
            usersWithoutBirthInNewDB: usersWithoutBirth
        });
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

run();
