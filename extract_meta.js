require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.jobCategory.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { id: 'asc' }
        });

        const regions = await prisma.region.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { id: 'asc' }
        });

        console.log('=== CATEGORIES ===');
        console.log(JSON.stringify(categories, null, 2));
        console.log('\n=== REGIONS ===');
        console.log(JSON.stringify(regions, null, 2));
    } catch (error) {
        console.error('Extraction Error:', error);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
