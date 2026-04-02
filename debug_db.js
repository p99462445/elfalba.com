const { execSync } = require('child_process');
const dbUrl = "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

// Just use npx prisma to run a raw query via DB SEED or similar? 
// Or just let's try to fix the env in node.
process.env.DATABASE_URL = dbUrl;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: { url: dbUrl }
    }
});

async function run() {
    try {
        console.log('Fetching columns for "Job" table...');
        const cols = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Job'
        `);
        console.table(cols);
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

run();
