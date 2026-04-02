const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('--- EMERGENCY DB UPDATE IN PROGRESS ---');
        console.log('Ensuring all footer fields exist in SiteConfig...');
        
        await pool.query(`
            ALTER TABLE "SiteConfig" 
            ADD COLUMN IF NOT EXISTS "footer_ceo_name" TEXT NOT NULL DEFAULT '박근홍',
            ADD COLUMN IF NOT EXISTS "footer_fax" TEXT NOT NULL DEFAULT '0504-175-2445',
            ADD COLUMN IF NOT EXISTS "footer_job_info_num" TEXT NOT NULL DEFAULT 'J1515020170005';
        `);
        
        await pool.query(`
            UPDATE "SiteConfig" 
            SET "footer_ceo_name" = '박근홍',
                "footer_fax" = '0504-175-2445',
                "footer_job_info_num" = 'J1515020170005'
            WHERE id = 'default' AND "footer_ceo_name" IS NULL;
        `);

        console.log('--- DB UPDATE SUCCESSFUL ---');
    } catch (err) {
        console.error('--- DB UPDATE FAILED ---', err.message);
    } finally {
        await pool.end();
    }
}

run();
