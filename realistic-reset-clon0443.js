
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function realisticReset() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const client = new Client({
        connectionString: "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const id = 'clon0443';
    const email = `${id}@badalba.com`;

    console.log(`\n>>> STARTING REALISTIC RESET FOR ${id}...`);

    // 1. Delete NEW auth users to start fresh
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingAuth = listData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingAuth) {
        await supabase.auth.admin.deleteUser(existingAuth.id);
        console.log(`- Deleted existing Supabase Auth user: ${existingAuth.id}`);
    }

    // 2. Set LegacyMember as unmigrated
    await client.query('UPDATE "LegacyMember" SET is_migrated = false WHERE username = $1', [id]);
    console.log(`- LegacyMember reset: is_migrated = false`);

    // 3. Find the most recent User record (the one I just created/synced to)
    const findRes = await client.query('SELECT id, email, old_id FROM "User" WHERE email = $1 AND old_id = $2', [email, id]);
    const currentUserId = findRes.rows[0]?.id;

    if (currentUserId) {
        console.log(`- Current active User record: ${currentUserId}`);
        // This is the record where the job is currently. For a realistic test, I will keep THIS record
        // but it has the WRONG random ID. When the next migration creates a NEW random ID, 
        // the API should find this one by old_id and sync again.
    } else {
        console.log("! No active User record found. Checking if it's still named backup...");
        const backupRes = await client.query('SELECT id FROM "User" WHERE email LIKE $1', [`%clon0443%`]);
        if (backupRes.rows[0]) {
            const bid = backupRes.rows[0].id;
            await client.query('UPDATE "User" SET email = $1, old_id = $2 WHERE id = $3', [email, id, bid]);
            console.log(`- Restored backup record ${bid} to active status.`);
        }
    }

    await client.end();
    console.log('\n--- RESET COMPLETE. clon0443 is ready for a NEW migration test. ---');
}

realisticReset().catch(console.error);
