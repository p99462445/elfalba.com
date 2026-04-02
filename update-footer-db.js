const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Updating SiteConfig table with footer fields...');
        
        await pool.query(`
            ALTER TABLE "SiteConfig" 
            ADD COLUMN IF NOT EXISTS "footer_ceo_name" TEXT NOT NULL DEFAULT '박근홍',
            ADD COLUMN IF NOT EXISTS "footer_fax" TEXT NOT NULL DEFAULT '0504-175-2445';
        `);
        
        // 데이터 정합성을 위한 초기 업데이트
        await pool.query(`
            UPDATE "SiteConfig" 
            SET "footer_address" = '서울특별시 송파구 올림픽로 212 , 에이동 1343호',
                "footer_business_num" = '623-86-00786',
                "footer_ceo_name" = '박근홍',
                "footer_fax" = '0504-175-2445'
            WHERE id = 'default';
        `);

        console.log('SiteConfig table updated successfully.');
    } catch (err) {
        console.error('Failed to update SiteConfig manually:', err);
    } finally {
        await pool.end();
    }
}

run();
