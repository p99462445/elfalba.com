
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    const user = data.users.find(u => u.email === 'kkhhss2501@badalba.com');
    if (user) {
        console.log('--- FOUND ---');
        console.log('Email:', user.email);
        console.log('ID:', user.id);
    } else {
        console.log('--- NOT FOUND IN AUTH ---');
    }
}

check().catch(console.error);
