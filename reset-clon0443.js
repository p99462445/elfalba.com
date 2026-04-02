
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function reset() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const client = new Client({
        connectionString: "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const id = 'clon0443';
    const email = `${id}@badalba.com`;

    console.log(`\n>>> RESETTING ${id} FOR MIGRATION TEST...`);

    // 1. Reset LegacyMember status
    const legacyUpdate = await client.query('UPDATE "LegacyMember" SET is_migrated = false WHERE username = $1', [id]);
    console.log(`- LegacyMember reset to unmigrated: ${legacyUpdate.rowCount} rows`);

    // 2. Rename existing User to avoid unique constraints, but keep it for ID Sync test
    const userRename = await client.query('UPDATE "User" SET email = $1, old_id = NULL WHERE old_id = $2 OR email = $3', [`backup_${Date.now()}_${id}@badalba.com`, id, email]);
    console.log(`- Existing User record backed up/renamed: ${userRename.rowCount} rows`);

    // 3. Delete from Supabase Auth
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('List error:', listError);
    } else {
        const target = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (target) {
            const { error: delError } = await supabase.auth.admin.deleteUser(target.id);
            if (delError) console.error('Supabase Delete error:', delError);
            else console.log(`- Deleted Supabase Auth User: ${target.id}`);
        } else {
            console.log("- No matching Supabase Auth user found (already clean).");
        }
    }

    await client.end();
    console.log('\n--- RESET COMPLETE. YOU CAN NOW TEST MIGRATION WITH clon0443 / 1 ---');
}

reset().catch(console.error);
