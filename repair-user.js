
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function repair(username) {
    const email = `${username}@badalba.com`;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();

    console.log(`\nRepairing user: ${username} (${email})`);
    
    // 1. Find the Auth ID
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    const authUser = data.users.find(u => u.email === email);
    
    // 2. Find the DB user
    const uRes = await client.query('SELECT id FROM "public"."User" WHERE old_id = $1 OR email = $2', [username, email]);
    const dbUserId = uRes.rows[0]?.id;

    if (authUser && dbUserId) {
        if (authUser.id !== dbUserId) {
            console.log(`- ID Discrepancy! Auth: ${authUser.id}, DB: ${dbUserId}. Syncing...`);
            // Transactional Sync
            await client.query('BEGIN');
            try {
                // Update Employer set user_id = authId where user_id = dbUserId
                await client.query('UPDATE "public"."Employer" SET user_id = $1 WHERE user_id = $2', [authUser.id, dbUserId]);
                // Update Payments, Bookmarks, etc. if needed
                await client.query('UPDATE "public"."Payment" SET user_id = $1 WHERE user_id = $2', [authUser.id, dbUserId]);
                await client.query('UPDATE "public"."Notification" SET user_id = $1 WHERE user_id = $2', [authUser.id, dbUserId]);
                
                // Finally rename the user record
                await client.query('UPDATE "public"."User" SET id = $1 WHERE id = $2', [authUser.id, dbUserId]);
                await client.query('COMMIT');
                console.log(`- Successfully synced DB ID to ${authUser.id}`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.log('- FAILED to sync ID:', err.message);
                
                // Alternative: Delete Auth User and retry?
                console.log('- Trying alternative: Delete Auth user to allow fresh migration...');
                await supabase.auth.admin.deleteUser(authUser.id);
                console.log('- Deleted Auth User.');
            }
        } else {
            console.log('- IDs are already synced.');
        }
    } else if (authUser && !dbUserId) {
        console.log('- Auth user exists but NO DB user! Deleting Auth user to allow fresh migration...');
        await supabase.auth.admin.deleteUser(authUser.id);
    } else if (!authUser && dbUserId) {
        console.log('- DB user exists but NO Auth user. Ready for migration.');
    } else {
        console.log('- Full Reset: No Auth and No DB records found.');
    }

    // Reset Migration state
    await client.query('UPDATE "public"."LegacyMember" SET is_migrated = false WHERE username = $1', [username]);
    console.log('- Reset LegacyMember state to not_migrated.');
    
    await client.end();
}

async function run() {
    await repair('kkhhss2501');
    await repair('kkhhss01');
}

run().catch(console.error);
