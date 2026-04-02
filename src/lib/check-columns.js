const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkColumns() {
    try {
        console.log('--- Checking Job table columns ---');
        const jobs = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Job'
        `;
        console.log(JSON.stringify(jobs, null, 2));

        console.log('--- Checking Payment table columns ---');
        const payments = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Payment'
        `;
        console.log(JSON.stringify(payments, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkColumns();
