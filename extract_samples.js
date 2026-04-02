require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            include: { employer: true }
        });

        const job = await prisma.job.findFirst({
            include: {
                employer: true,
                category: true,
                region: true,
                images: true
            }
        });

        console.log('=== USER SAMPLE ===');
        console.log(JSON.stringify(user, null, 2));
        console.log('\n=== JOB SAMPLE ===');
        console.log(JSON.stringify(job, null, 2));
    } catch (error) {
        console.error('Extraction Error:', error);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
