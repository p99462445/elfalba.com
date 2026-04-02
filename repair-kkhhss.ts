
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const users = ['kkhhss2501', 'kkhhss01'];
    
    for (const username of users) {
        console.log(`\n>>> Processing ${username} ...`);
        
        // 1. Reset LegacyMember
        await client.query('UPDATE "public"."LegacyMember" SET is_migrated = false WHERE username = $1', [username]);
        console.log(`- Set is_migrated = false for ${username}`);

        // 2. Delete Supabase Auth User if exists
        const email = `${username}@badalba.com`;
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        const targetAuth = authUsers.users.find(u => u.email === email);
        if (targetAuth) {
            console.log(`- Found Auth User ${targetAuth.id}. Deleting...`);
            await supabase.auth.admin.deleteUser(targetAuth.id);
            console.log(`- Deleted Auth User ${targetAuth.id}`);
        } else {
            console.log('- No Auth User found.');
        }

        // 3. Cleanup DB User but PRESERVE Employer (to keep jobs)
        // Find existing user in DB
        const uRes = await client.query('SELECT id FROM "public"."User" WHERE old_id = $1 OR email = $2', [username, email]);
        if (uRes.rows.length > 0) {
            const dbUserId = uRes.rows[0].id;
            console.log(`- Found DB User ${dbUserId}. Cleaning up...`);
            
            // To "Reset", we clear the email and old_id so they don't block fresh migration
            // BUT we keep the record so it doesn't break foreign keys for now.
            // Or better: Change email to something unique.
            const dummyEmail = `${username}_reset_${Date.now()}@badalba.com`;
            await client.query('UPDATE "public"."User" SET email = $1, old_id = NULL WHERE id = $2', [dummyEmail, dbUserId]);
            console.log(`- Renamed DB User email to ${dummyEmail} and cleared old_id.`);
        } else {
            console.log('- No DB User found.');
        }
    }

    await client.end();
    console.log('\n--- RESET COMPLETE ---');
}

run().catch(console.error);
