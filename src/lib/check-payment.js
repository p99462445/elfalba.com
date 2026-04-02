const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestPayment() {
    try {
        const latestPayment = await prisma.payment.findFirst({
            orderBy: { created_at: 'desc' },
            include: { job: true, product: true }
        });
        console.log('--- Latest Payment ---');
        console.log(JSON.stringify(latestPayment, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestPayment();
