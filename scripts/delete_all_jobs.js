const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true";
process.env.DIRECT_URL = "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient();

async function main() {
    console.log('Deleting all jobs from DB...');
    // Note: If you have foreign key constraints from other tables referencing Job,
    // they might fail unless on delete cascade is set. Assuming prisma handles it.
    const res = await prisma.job.deleteMany({});
    console.log(`Successfully deleted ${res.count} jobs.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
