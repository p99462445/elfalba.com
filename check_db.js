const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const job = await prisma.job.findFirst();
        console.log('Successfully fetched a job.');
        console.log('Columns in first job:', job ? Object.keys(job) : 'No jobs found');

        if (job) {
            console.log('Updating job', job.id, 'with business_name...');
            await prisma.job.update({
                where: { id: job.id },
                data: { business_name: 'Test Update' }
            });
            console.log('Update Successful');
        }
    } catch (e) {
        console.error('ERROR during check:', e.message);
        if (e.code) console.error('Error Code:', e.code);
    } finally {
        await prisma.$disconnect();
    }
}

check();
