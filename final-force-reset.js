
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function reset() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const username = 'kkhhss2501';
    const email = `${username}@badalba.com`;

    console.log(`\n>>> FORCING RESET FOR ${username} ...`);

    // 1. Reset LegacyMember
    const updateRes = await client.query('UPDATE \"LegacyMember\" SET is_migrated = false WHERE username = $1', [username]);
    console.log(`- Set is_migrated = false: ${updateRes.rowCount} rows affected`);

    // 2. Clear out existing User record to avoid conflicts
    const userRes = await client.query('SELECT id FROM \"User\" WHERE old_id = $1 OR email = $2', [username, email]);
    if (userRes.rows.length > 0) {
        for (const row of userRes.rows) {
            const userId = row.id;
            const newEmail = `reset_${username}_${Date.now()}@badalba.com`;
            await client.query('UPDATE \"User\" SET email = $1, old_id = NULL WHERE id = $2', [newEmail, userId]);
            console.log(`- Renamed User ${userId} to ${newEmail}`);
        }
    }

    // 3. Delete Supabase Auth User
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('List error:', listError);
    } else {
        const target = listData.users.find(u => u.email === email);
        if (target) {
            const { error: delError } = await supabase.auth.admin.deleteUser(target.id);
            if (delError) console.error('Delete error:', delError);
            else console.log(`- Deleted Auth User ${target.id}`);
        }
    }

    await client.end();
    console.log('\n--- FINAL RESET COMPLETE ---');
}

reset().catch(console.error);
