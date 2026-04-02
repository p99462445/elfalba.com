const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalRestore(username) {
  console.log(`🚀 [FINAL RESTORE] Targeting ${username}...`);
  const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await pgClient.connect();
    const email = `${username}@badalba.com`;

    // 1. Ensure User exists and get ID
    let userRes = await pgClient.query(`SELECT id FROM "public"."User" WHERE old_id = $1`, [username]);
    let userId;
    const crypto = require('crypto');
    if (userRes.rows.length === 0) {
      console.log(`- User missing, creating placeholder User...`);
      userId = crypto.randomUUID();
      await pgClient.query(`INSERT INTO "public"."User" (id, email, old_id, name, role, is_adult, updated_at) VALUES ($1, $2, $3, $4, 'EMPLOYER', true, NOW())`, 
        [userId, email, username, username]);
    } else {
      userId = userRes.rows[0].id;
      console.log(`- Found User ID: ${userId}`);
    }

    // 2. Ensure Employer exists
    let empRes = await pgClient.query(`SELECT id FROM "public"."Employer" WHERE user_id = $1`, [userId]);
    let employerId;
    if (empRes.rows.length === 0) {
      console.log(`- Employer missing, creating one...`);
      employerId = crypto.randomUUID();
      await pgClient.query(`INSERT INTO "public"."Employer" (id, user_id, business_name, updated_at) VALUES ($1, $2, '업소회원', NOW())`, 
        [employerId, userId]);
    } else {
      employerId = empRes.rows[0].id;
      console.log(`- Found Employer ID: ${employerId}`);
    }

    // 3. Clear existing jobs (to avoid duplicates for this reset)
    await pgClient.query(`DELETE FROM "public"."Job" WHERE employer_id = $1`, [employerId]);

    // 4. Load Excel Jobs
    const jobsData = JSON.parse(fs.readFileSync('jobs.json', 'utf8'));
    console.log(`- Restoring ${jobsData.length} original jobs from Excel...`);
    
    for (const job of jobsData) {
      const jobId = crypto.randomUUID();
      // Using confirmed IDs: category_id=1, region_id=162
      await pgClient.query(`
        INSERT INTO "public"."Job" (id, employer_id, category_id, region_id, title, business_name, description, contact_value, created_at, updated_at, status)
        VALUES ($1, $2, 1, 162, $3, $4, $5, $6, $7, NOW(), 'ACTIVE')
      `, [jobId, employerId, job.title, job.company_name, job.content, job.phone, new Date(job.created_at)]);
    }

    // 5. Reset Migration Status
    await pgClient.query(`UPDATE "public"."LegacyMember" SET is_migrated = false WHERE username = $1`, [username]);
    
    // 6. Delete from Supabase Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError) {
      const authUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (authUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        console.log(`- Purged Auth user.`);
      }
    }

    console.log(`✅ [COMPLETE] ${username} is now reset but his original jobs are restored!`);
  } catch (err) {
    console.error(`❌ Restore failed:`, err);
  } finally {
    await pgClient.end();
  }
}

finalRestore(process.argv[2]);
