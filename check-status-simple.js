
const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        connectionString: "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const username = 'clon0443';
    
    // 1. Check LegacyMember
    const legacy = await client.query('SELECT username, is_migrated FROM "LegacyMember" WHERE username = $1', [username]);
    console.log("LegacyMember Status:", legacy.rows[0]);

    // 2. Check User
    const user = await client.query('SELECT id, email, old_id FROM "User" WHERE old_id = $1 OR email = $2', [username, `${username}@badalba.com`]);
    console.log("New User Record:", user.rows[0]);

    await client.end();
}

check().catch(console.error);
