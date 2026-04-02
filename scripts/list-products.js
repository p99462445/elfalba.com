require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || '';
const cleanConnectionString = connectionString.trim().replace(/[\r\n]/g, '');
const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('--- Current Products in DB ---');
        const products = await prisma.product.findMany({
            orderBy: [{ product_type: 'asc' }, { price: 'asc' }]
        });

        if (products.length === 0) {
            console.log('No products found.');
        } else {
            products.forEach(p => {
                console.log(`[${p.product_type}] ${p.name} - ${p.price.toLocaleString()}원 (${p.duration_days || 0}일)`);
            });
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
