import prisma from './src/lib/prisma';

async function main() {
    const jobs = await prisma.job.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
            region: true,
            regions: {
                include: { region: true }
            }
        }
    });

    for (const job of jobs) {
        console.log(`Job: ${job.title}`);
        console.log(`- Main Region: ${job.region?.name}`);
        console.log(`- All Regions: ${job.regions.map(r => r.region.name).join(', ')}`);
        console.log('---');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
