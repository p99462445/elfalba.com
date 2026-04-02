const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function createTable() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const sql = `
            CREATE TABLE IF NOT EXISTS "public"."LegacyMember" (
                "id" TEXT NOT NULL,
                "username" TEXT NOT NULL,
                "name" TEXT,
                "birthdate" TEXT,
                "phone" TEXT,
                "role" TEXT,
                "is_migrated" BOOLEAN NOT NULL DEFAULT false,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "LegacyMember_pkey" PRIMARY KEY ("id")
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "LegacyMember_username_key" ON "public"."LegacyMember"("username");
            CREATE INDEX IF NOT EXISTS "LegacyMember_username_idx" ON "public"."LegacyMember"("username");
        `;

        await client.query(sql);
        console.log('✅ LegacyMember table and indexes created successfully.');

    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        await client.end();
    }
}

createTable();
