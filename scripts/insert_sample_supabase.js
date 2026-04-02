const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const email = 'kkhhssm2501@naver.com';
    const old_id = 'kkhhss2501';

    console.log('Inserting with Supabase SDK...');

    try {
        // 1. Delete if exists in public schema User table
        await supabase.from('User').delete().eq('email', email);

        // 2. Insert User
        const { data: user, error: userError } = await supabase
            .from('User')
            .insert([
                {
                    id: crypto.randomUUID(),
                    email,
                    old_id,
                    role: 'EMPLOYER',
                    status: 'ACTIVE',
                    is_adult: true,
                    nickname: old_id,
                    updated_at: new Date().toISOString(),
                }
            ])
            .select()
            .single();

        if (userError) throw userError;

        // 3. Insert Employer
        const { error: empError } = await supabase
            .from('Employer')
            .insert([
                {
                    id: crypto.randomUUID(),
                    user_id: user.id,
                    business_name: '샘플업소_1',
                    business_number: '5397400533',
                    address: '샘플 주소 (서울시 강남구)',
                }
            ]);

        if (empError) throw empError;

        console.log('Sample user 1 inserted via Supabase SDK successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
