const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function findUser() {
    // Note: To search by email, we usually need the service role key or the user must be logged in.
    // The anon key might not allow searching all users.
    // But let's try to sign in with the provided credentials.
    const { data, error } = await supabase.auth.signInWithPassword({
        email: '1@gmail.com',
        password: '000000'
    });

    if (error) {
        console.error('Supabase Login Failed:', error.message);
        return;
    }

    console.log('Supabase Login Success!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
}

findUser();
