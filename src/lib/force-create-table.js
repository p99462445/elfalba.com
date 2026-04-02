const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Manually creating SmsLog table...');
        
        // Check if enum exists
        const enumCheck = await pool.query("SELECT n.nspname as schema, t.typname as type FROM pg_type t LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'SmsStatus'");
        if (enumCheck.rows.length === 0) {
            await pool.query("CREATE TYPE \"SmsStatus\" AS ENUM ('PENDING', 'SUCCESS', 'FAILURE')");
            console.log('Enum SmsStatus created.');
        }

        // Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "SmsLog" (
                "id" TEXT NOT NULL,
                "to" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
                "error_message" TEXT,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
            )
        `);
        console.log('Table SmsLog created.');

        // Create indexes
        await pool.query('CREATE INDEX IF NOT EXISTS "SmsLog_to_idx" ON "SmsLog"("to")');
        await pool.query('CREATE INDEX IF NOT EXISTS "SmsLog_created_at_idx" ON "SmsLog"("created_at" DESC)');
        console.log('Indexes created.');

    } catch (err) {
        console.error('Failed to create table manually:', err);
    } finally {
        await pool.end();
    }
}

run();
