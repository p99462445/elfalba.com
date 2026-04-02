const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
    try {
        const jobColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Job'`;
        console.log('--- Job Columns ---');
        console.log(jobColumns.map(c => c.column_name).sort());

        const imageColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'JobImage'`;
        console.log('--- JobImage Columns ---');
        console.log(imageColumns.map(c => c.column_name).sort());
    } catch (e) {
        console.error('SQL Check Failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkColumns();
