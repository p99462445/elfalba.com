const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const emails = ['elf@elf.com', '1@gmail.com'];

    for (const email of emails) {
        try {
            // 1. Get user by email
            const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
            if (fetchError) throw fetchError;

            const user = users.find(u => u.email === email);
            if (!user) {
                console.log(`User not found: ${email}`);
                continue;
            }

            // 2. Update user metadata
            const { data, error: updateError } = await supabase.auth.admin.updateUserById(
                user.id,
                { user_metadata: { is_adult: true, role: user.user_metadata?.role || 'USER' } }
            );

            if (updateError) throw updateError;
            console.log(`Successfully updated metadata for ${email}`);
        } catch (err) {
            console.error(`Error updating ${email}:`, err.message);
        }
    }
}

main();
