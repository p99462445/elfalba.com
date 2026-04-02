import prisma from './src/lib/prisma';

async function main() {
    try {
        const legacy: any[] = await (prisma as any).$queryRawUnsafe(
            'SELECT member_id, title FROM "LegacyJob" WHERE member_id != \'hun268\' LIMIT 2'
        );
        console.log(JSON.stringify(legacy, null, 2));
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
