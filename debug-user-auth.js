
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const emails = ['kkhhss01@badalba.com', 'kkhhss2501@badalba.com'];
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    for (const email of emails) {
        console.log(`--- Checking ${email} ---`);
        const authUser = data.users.find(u => u.email === email);
        if (authUser) {
            console.log('Supabase Auth User:', authUser.id);
        } else {
            console.log('No Supabase Auth User found.');
        }

        const uRes = await client.query('SELECT id, old_id FROM "public"."User" WHERE email = $1 OR old_id = $2', [email, email.split('@')[0]]);
        if (uRes.rows.length > 0) {
            console.log('Database Users:', uRes.rows);
        } else {
            console.log('No Database User found.');
        }
    }

    await client.end();
}

main().catch(console.error);
