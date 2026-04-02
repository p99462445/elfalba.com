const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function forceReset(username) {
  const email = `${username}@badalba.com`;
  console.log(`🔨 Forcing password reset for ${email} to "123123"...`);

  try {
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    const authUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!authUser) {
      console.log(`❌ No user found for ${email}`);
      return;
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: '123123' }
    );

    if (error) throw error;
    console.log(`✅ Password successfully reset to 123123 for ${email}`);

  } catch (error) {
    console.error(`❌ Force reset failed:`, error);
  }
}

forceReset(process.argv[2]);
