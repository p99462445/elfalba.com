
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    console.log('--- User Check ---');
    const uRes = await client.query('SELECT id, email, old_id FROM "public"."User" WHERE old_id LIKE $1 OR email LIKE $2', ['kkhhss%', 'kkhhss%']);
    console.log(uRes.rows);

    console.log('\n--- Employer Check ---');
    const eRes = await client.query('SELECT id, user_id, business_name FROM "public"."Employer" WHERE user_id IN (SELECT id FROM "public"."User" WHERE old_id LIKE $1 OR email LIKE $2)', ['kkhhss%', 'kkhhss%']);
    console.log(eRes.rows);

    console.log('\n--- LegacyMember Check ---');
    const lRes = await client.query('SELECT username, is_migrated FROM "public"."LegacyMember" WHERE username LIKE $1', ['kkhhss%']);
    console.log(lRes.rows);

    await client.end();
}

main().catch(console.error);
