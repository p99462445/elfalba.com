const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Finalizing SiteConfig footer fields...');
        
        await pool.query(`
            ALTER TABLE "SiteConfig" 
            ADD COLUMN IF NOT EXISTS "footer_job_info_num" TEXT NOT NULL DEFAULT 'J1515020170005';
        `);
        
        await pool.query(`
            UPDATE "SiteConfig" 
            SET "footer_job_info_num" = 'J1515020170005'
            WHERE id = 'default';
        `);

        console.log('SiteConfig table finalized successfully.');
    } catch (err) {
        console.error('Failed to update SiteConfig manually:', err);
    } finally {
        await pool.end();
    }
}

run();
