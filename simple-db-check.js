
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function check() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    const res = await client.query('SELECT username, is_migrated FROM "LegacyMember" WHERE username LIKE $1', ['kkhh%']);
    console.log('Legacy:', res.rows);
    
    const uRes = await client.query('SELECT id, email, old_id FROM "User" WHERE old_id LIKE $1', ['kkhh%']);
    console.log('User:', uRes.rows);
    
    await client.end();
}

check().catch(console.error);
