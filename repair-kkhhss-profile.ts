
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const username = 'kkhhss2501';
    
    // 1. Get the current User ID
    const uRes = await client.query('SELECT id FROM "public"."User" WHERE old_id = $1', [username]);
    const userId = uRes.rows[0]?.id;
    if (!userId) {
        console.error('User not found.');
        await client.end();
        return;
    }

    // 2. Find the Employer and its Jobs
    const eRes = await client.query('SELECT id FROM "public"."Employer" WHERE user_id = $1', [userId]);
    const empId = eRes.rows[0]?.id;
    if (!empId) {
        console.error('Employer not found.');
        await client.end();
        return;
    }

    const jRes = await client.query('SELECT title, manager_name, contact_value, business_name FROM "public"."Job" WHERE employer_id = $1 ORDER BY created_at DESC', [empId]);
    const jobs = jRes.rows;
    console.log(`Found ${jobs.length} jobs in DB for this employer.`);

    if (jobs.length > 0) {
        const bestJob = jobs[0];
        const bizName = bestJob.business_name || username;
        const managerName = bestJob.manager_name || '미지정';
        const phone = bestJob.contact_value || '010-0000-0000';
        
        console.log(`Updating Employer profile with: ${bizName}, ${managerName}, ${phone}`);
        
        // 3. Update Employer profile
        await client.query(`
            UPDATE "public"."Employer" 
            SET business_name = $1, owner_name = $2, phone = $3, address = $4, address_detail = $5
            WHERE id = $6
        `, [bizName, managerName, phone, '서울 강남구', '상세주소', empId]); // Placeholders for address
        
        // 4. Update User Profile too
        await client.query('UPDATE "public"."User" SET name = $1, phone = $2, real_name = $3 WHERE id = $4', [managerName, phone, managerName, userId]);
    }

    // 5. RESET LOGIN STATE for testing the flow
    console.log('- Resetting LegacyMember and Auth...');
    await client.query('UPDATE "public"."LegacyMember" SET is_migrated = false WHERE username = $1', [username]);
    
    // Auth deletion handled by another script but let's inform the user
    console.log('Reset complete. Please delete Auth user "kkhhss2501@badalba.com" and retry login.');

    await client.end();
}

run().catch(console.error);
