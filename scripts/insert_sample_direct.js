const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to DB via Pooler');

        // Attempt sample insert
        const email = 'kkhhssm2501@naver.com';
        const old_id = 'kkhhss2501';

        // Use subquery or separate queries for safety
        await client.query('DELETE FROM "Employer" WHERE user_id IN (SELECT id FROM "User" WHERE email = $1)', [email]);
        await client.query('DELETE FROM "User" WHERE email = $1', [email]);

        const insertUser = await client.query(
            'INSERT INTO "User" (id, email, old_id, role, status, is_adult, updated_at, "created_at") VALUES (gen_random_uuid(), $1, $2, \'EMPLOYER\', \'ACTIVE\', true, NOW(), NOW()) RETURNING id',
            [email, old_id]
        );
        const userId = insertUser.rows[0].id;

        await client.query(
            'INSERT INTO "Employer" (id, user_id, business_name, business_number, address) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
            [userId, '샘플업소_1', '5397400533', '샘플 주소 (서울시 강남구)']
        );

        console.log('Sample user 1 inserted successfully!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
