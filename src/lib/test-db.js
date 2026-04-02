const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testPaymentDBUpdate() {
    console.log('--- DB Update Diagnostic ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'OK (hidden)' : 'MISSING');

    try {
        // 1. Get a sample job, product, and user
        const job = await prisma.job.findFirst();
        const product = await prisma.product.findFirst();
        const user = await prisma.user.findFirst();

        if (!job || !product || !user) {
            console.error('Needs at least one job, product, and user in DB.');
            return;
        }

        console.log(`Using Job: ${job.id}, Product: ${product.id}, User: ${user.id}`);

        // 2. Perform transaction simulation
        await prisma.$transaction(async (tx) => {
            console.log('Starting transaction...');
            
            const payment = await tx.payment.create({
                data: {
                    user_id: user.id,
                    product_id: product.id,
                    job_id: job.id,
                    amount: 100,
                    payment_method: 'CARD',
                    status: 'APPROVED', // This was 'APPROVED' in the code
                    depositor_name: '카드결제데모',
                    pg_transaction_id: 'TEST_TID_123',
                    payment_info: { test: true }
                }
            });
            console.log('Payment created:', payment.id);

            const updatedJob = await tx.job.update({
                where: { id: job.id },
                data: {
                    status: 'ACTIVE'
                }
            });
            console.log('Job status updated:', updatedJob.status);
            
            // Rollback if needed for testing, but let's commit once to see
            // throw new Error('Rolling back for test');
        });

        console.log('--- Success ---');
    } catch (e) {
        console.error('--- Failed ---');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testPaymentDBUpdate();
