
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- Supabase Auth Check ---');
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    const u = data.users.find(u => u.email === 'kkhhss2501@badalba.com');
    console.log(u);
    
    // Check for kkhhss01 too
    const u2 = data.users.find(u => u.email === 'kkhhss01@badalba.com');
    if (u2) console.log('kkhhss01:', u2);
}

main().catch(console.error);
