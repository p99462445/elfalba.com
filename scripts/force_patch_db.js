const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. Add MONTHLY to SalaryType enum (with safe check)
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type t 
                               JOIN pg_enum e ON t.oid = e.enumtypid 
                               WHERE t.typname = 'SalaryType' AND e.enumlabel = 'MONTHLY') THEN
                    ALTER TYPE "SalaryType" ADD VALUE 'MONTHLY';
                    RAISE NOTICE 'Added MONTHLY to SalaryType';
                ELSE
                    RAISE NOTICE 'MONTHLY already exists in SalaryType';
                END IF;
            END
            $$;
        `);

        // 2. Add categories if not exist
        const categories = [
            { name: '촬영보조', slug: 'camera-assistant' },
            { name: '연기자', slug: 'actor' },
            { name: '보조출연', slug: 'extra' },
            { name: '기타', slug: 'etc' },
        ];

        for (const cat of categories) {
            await client.query(`
                INSERT INTO "JobCategory" (name, slug, created_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            `, [cat.name, cat.slug]);
            console.log(`Upserted category: ${cat.name}`);
        }

        console.log('DB Patch applied successfully');
    } catch (err) {
        console.error('Error applying DB patch:', err);
    } finally {
        await client.end();
    }
}

main();
