const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL.trim().replace(/[\r\n]/g, ''),
    ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const emails = ['elf@elf.com', '1@gmail.com'];
    for (const email of emails) {
        try {
            const res = await prisma.user.updateMany({
                where: { email },
                data: {
                    is_adult: true,
                    verified_at: new Date(),
                    terms_agreed: true,
                    privacy_agreed: true
                }
            });
            console.log(`Updated ${email}: ${res.count} rows`);
        } catch (err) {
            console.error(`Failed to update ${email}:`, err);
        }
    }
    await prisma.$disconnect();
    await pool.end();
}

main();
