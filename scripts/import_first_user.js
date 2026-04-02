require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { createClient } = require('@supabase/supabase-js');

// Prisma initialization with adapter (same as src/lib/prisma.ts)
const connectionString = process.env.DATABASE_URL || '';
const cleanConnectionString = connectionString.trim().replace(/[\r\n]/g, '');
const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const userData = {
        old_id: 'kkhhss2501',
        email: 'kkhhss2501@badalba.com',
        password: '000000',
        name: '김승찬',
        phone: '010-2512-6784',
        birthdate: '2002-11-08',
        gender: 'MALE',
        business_number: '5397400533',
        role: 'EMPLOYER'
    };

    console.log(`--- Importing User: ${userData.old_id} ---`);

    try {
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email: userData.email }, { old_id: userData.old_id }] }
        });

        if (existing) {
            console.log(`User ${userData.old_id} already exists in Prisma. Deleting for fresh import...`);
            await supabase.auth.admin.deleteUser(existing.id).catch(() => { });
            await prisma.user.delete({ where: { id: existing.id } }).catch(() => { });
        }

        console.log('Creating Supabase Auth account...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: { nickname: userData.old_id }
        });

        if (authError) {
            throw new Error(`Supabase Auth Error: ${authError.message}`);
        }

        const userId = authData.user.id;
        console.log(`Supabase User Created: ${userId}`);

        console.log('Creating Prisma User & Employer records...');
        await prisma.user.create({
            data: {
                id: userId,
                email: userData.email,
                old_id: userData.old_id,
                nickname: userData.old_id,
                real_name: userData.name,
                name: userData.name,
                phone: userData.phone,
                birthdate: userData.birthdate,
                gender: userData.gender,
                role: 'EMPLOYER',
                is_adult: true,
                verified_at: new Date(),
                status: 'ACTIVE',
                employer: {
                    create: {
                        business_name: '신규등록업소',
                        business_number: userData.business_number,
                        owner_name: userData.name,
                        phone: userData.phone,
                        verification_status: 'APPROVED'
                    }
                }
            }
        });

        console.log('--- SUCCESS: User imported successfully! ---');

    } catch (error) {
        console.error('--- ERROR ---');
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
