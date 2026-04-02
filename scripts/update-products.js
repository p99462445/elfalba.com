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
    const products = [
        // 일반 (GENERAL_SLOT) - 30일 기준 300회
        { name: '일반 (30일)', price: 66000, duration_days: 30, jump_count: 300, product_type: 'GENERAL_SLOT' },
        { name: '일반 (60일)', price: 125000, duration_days: 60, jump_count: 600, product_type: 'GENERAL_SLOT' },
        { name: '일반 (90일)', price: 178000, duration_days: 90, jump_count: 900, product_type: 'GENERAL_SLOT' },
        { name: '일반 (120일)', price: 240000, duration_days: 120, jump_count: 1200, product_type: 'GENERAL_SLOT' },
        // 추천 (VIP_SLOT) - 30일 기준 800회
        { name: '추천 (30일)', price: 150000, duration_days: 30, jump_count: 800, product_type: 'VIP_SLOT' },
        { name: '추천 (60일)', price: 260000, duration_days: 60, jump_count: 1600, product_type: 'VIP_SLOT' },
        { name: '추천 (90일)', price: 380000, duration_days: 90, jump_count: 2400, product_type: 'VIP_SLOT' },
        { name: '추천 (120일)', price: 490000, duration_days: 120, jump_count: 3200, product_type: 'VIP_SLOT' },
        // 프리미엄 (VVIP_SLOT) - 30일 기준 1300회
        { name: '프리미엄 (30일)', price: 330000, duration_days: 30, jump_count: 1300, product_type: 'VVIP_SLOT' },
        { name: '프리미엄 (60일)', price: 620000, duration_days: 60, jump_count: 2600, product_type: 'VVIP_SLOT' },
        { name: '프리미엄 (90일)', price: 890000, duration_days: 90, jump_count: 3900, product_type: 'VVIP_SLOT' },
        { name: '프리미엄 (120일)', price: 1100000, duration_days: 120, jump_count: 5200, product_type: 'VVIP_SLOT' },
    ];

    try {
        console.log('--- Updating Products in DB (New Jumps) ---');
        await prisma.payment.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.product.createMany({ data: products });
        console.log('SUCCESS: Products updated with new jump counts.');
    } catch (err) {
        console.error('Error updating products:', err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
