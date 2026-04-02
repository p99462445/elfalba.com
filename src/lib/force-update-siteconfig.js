const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Manually updating SiteConfig table...');
        
        await pool.query(`
            ALTER TABLE "SiteConfig" 
            ADD COLUMN IF NOT EXISTS "sms_expiry_2d_text" TEXT NOT NULL DEFAULT '♥엘프알바♥대표님의 광고가 2일 남으셨어요^.^연장 신청바랍니다 elfalba.com',
            ADD COLUMN IF NOT EXISTS "sms_expiry_2d_enabled" BOOLEAN NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "sms_expiry_1d_text" TEXT NOT NULL DEFAULT '♥엘프알바♥대표님의 광고가 내일 마감되세요^.^연장 신청바랍니다 elfalba.com',
            ADD COLUMN IF NOT EXISTS "sms_expiry_1d_enabled" BOOLEAN NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "sms_expired_1d_text" TEXT NOT NULL DEFAULT '♥엘프알바♥대표님의 광고가 마감되었어요^.^연장 신청바랍니다 elfalba.com',
            ADD COLUMN IF NOT EXISTS "sms_expired_1d_enabled" BOOLEAN NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "sms_payment_text" TEXT NOT NULL DEFAULT '[엘프알바] {금액}원 입금 부탁드립니다. {은행} {계좌} 예금주:{예금주}',
            ADD COLUMN IF NOT EXISTS "sms_payment_enabled" BOOLEAN NOT NULL DEFAULT true
        `);
        console.log('SiteConfig table updated successfully.');

    } catch (err) {
        console.error('Failed to update SiteConfig manually:', err);
    } finally {
        await pool.end();
    }
}

run();
