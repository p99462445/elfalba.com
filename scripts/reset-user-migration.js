const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const username = process.argv[2];
if (!username) {
    console.error('Usage: node scripts/reset-user-migration.js <username>');
    process.exit(1);
}

const email = `${username.toLowerCase()}@badalba.com`;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use DIRECT_URL for scripts to avoid pooler issues
const pgClient = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function reset() {
    console.log(`--- Resetting User: ${username} ---`);

    try {
        await pgClient.connect();

        // 1. Delete from Supabase Auth
        // We'll search for the user by email first
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (target) {
            await supabaseAdmin.auth.admin.deleteUser(target.id);
            console.log(`- Deleted Auth User: ${target.id}`);
        } else {
            console.log('- No Auth User found.');
        }

        // 2. Clear Public.User flags
        await pgClient.query('UPDATE "public"."User" SET is_activated = false WHERE LOWER(old_id) = LOWER($1) OR LOWER(email) = LOWER($2)', [username, email]);
        console.log('- Reset User table flags.');

        // 3. Reset LegacyMember flag
        await pgClient.query('UPDATE "public"."LegacyMember" SET is_migrated = false WHERE LOWER(username) = LOWER($1)', [username]);
        console.log('- Reset LegacyMember migration flag.');

        console.log('--- DONE! ---');
    } catch (err) {
        console.error('Reset Error:', err.message);
    } finally {
        await pgClient.end();
    }
}

reset();
