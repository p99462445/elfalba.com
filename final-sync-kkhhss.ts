
import fs from 'fs';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pkg from 'pg';
const { Client } = pkg;

async function run() {
    const raw = fs.readFileSync('jobs.json', 'utf8');
    const allJobs = JSON.parse(raw);
    
    const targetId = 'kkhhss2501';
    const myJobs = allJobs.filter((j: any) => j.username === targetId || j.member_id === targetId);
    
    console.log(`Found ${myJobs.length} original jobs for ${targetId}`);
    
    if (myJobs.length === 0) {
        console.log('No jobs found in jobs.json for this user.');
        return;
    }

    // Pick the most recent/detailed job for employer info
    const bestJob = myJobs[0];
    const bizName = bestJob.biz_name || bestJob.company_name || targetId;
    const managerName = bestJob.manager_name || bestJob.name || '미지정';
    const managerPhone = bestJob.phone || bestJob.manager_phone || '010-0000-0000';
    const address = bestJob.address || bestJob.addr || '';

    console.log(`Extracted Info: ${bizName}, ${managerName}, ${managerPhone}`);

    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // 1. Find User
    const uRes = await client.query('SELECT id FROM "public"."User" WHERE old_id = $1', [targetId]);
    const userId = uRes.rows[0]?.id;

    if (userId) {
        console.log('- Updating Employer and Jobs for User:', userId);
        
        // 2. Update Employer
        await client.query(`
            UPDATE "public"."Employer" 
            SET business_name = $1, owner_name = $2, phone = $3, address = $4
            WHERE user_id = $5
        `, [bizName, managerName, managerPhone, address, userId]);
        
        // 3. Update all Jobs (Manager info, etc.)
        await client.query(`
            UPDATE "public"."Job"
            SET manager_name = $1, contact_value = $2
            WHERE employer_id = (SELECT id FROM "public"."Employer" WHERE user_id = $3)
        `, [managerName, managerPhone, userId]);

        // 4. RESET LOGIN STATE
        // Set is_migrated = false
        await client.query('UPDATE "public"."LegacyMember" SET is_migrated = false WHERE username = $1', [targetId]);
        
        // HIDDEN: restore old_id if it was renamed/cleared by my previous reset
        // Wait, I already found it in uRes, so it must have old_id = kkhhss2501.
        
        // 5. DELETE AUTH RECORD
        // I'll do this in a separate step or just assume the user wants it deleted
        console.log('Reset complete. Please delete the Auth user manually or I will do it via script.');
    } else {
        console.log('User not found in DB with old_id = kkhhss2501');
    }

    await client.end();
}

run().catch(console.error);
