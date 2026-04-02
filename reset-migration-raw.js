const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetMigration(username) {
  console.log(`🚀 Resetting migration for ${username} (handling dependencies)...`);
  
  const pgClient = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = `${username}@badalba.com`;
    await pgClient.connect();

    // 0. Get the User UUID first if it exists
    const getUser = await pgClient.query(`SELECT id FROM "public"."User" WHERE old_id = $1`, [username]);
    const userId = getUser.rows[0]?.id;

    if (userId) {
      console.log(`- Found User UUID: ${userId}. Deleting dependencies...`);
      
      // Cleanup all tables with user_id or similar relations
      await pgClient.query(`DELETE FROM "public"."JobApplication" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."Payment" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."Comment" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."Bookmark" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."Notification" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."Post" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."SupportQA" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."SupportQAComment" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."Message" WHERE sender_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."LoginLog" WHERE user_id = $1`, [userId]);
      await pgClient.query(`DELETE FROM "public"."JobUpdateLog" WHERE user_id = $1`, [userId]);
      
      // Delete Jobs where this user is an employer
      const getEmployer = await pgClient.query(`SELECT id FROM "public"."Employer" WHERE user_id = $1`, [userId]);
      const employerId = getEmployer.rows[0]?.id;
      if (employerId) {
          console.log(`- Found Employer Entry: ${employerId}. Cleaning up jobs...`);
          // Delete dependencies of JOBS owned by this employer
          const jobsQuery = `SELECT id FROM "public"."Job" WHERE employer_id = $1`;
          const jobsRes = await pgClient.query(jobsQuery, [employerId]);
          const jobIds = jobsRes.rows.map(r => r.id);
          
          if (jobIds.length > 0) {
              await pgClient.query(`DELETE FROM "public"."JobApplication" WHERE job_id = ANY($1)`, [jobIds]);
              await pgClient.query(`DELETE FROM "public"."Payment" WHERE job_id = ANY($1)`, [jobIds]);
              await pgClient.query(`DELETE FROM "public"."Bookmark" WHERE job_id = ANY($1)`, [jobIds]);
              await pgClient.query(`DELETE FROM "public"."JobImage" WHERE job_id = ANY($1)`, [jobIds]);
              await pgClient.query(`DELETE FROM "public"."JobUpdateLog" WHERE job_id = ANY($1)`, [jobIds]);
              await pgClient.query(`DELETE FROM "public"."AutoJump" WHERE job_id = ANY($1)`, [jobIds]);
              await pgClient.query(`DELETE FROM "public"."Job" WHERE id = ANY($1)`, [jobIds]);
          }
          await pgClient.query(`DELETE FROM "public"."Employer" WHERE id = $1`, [employerId]);
          console.log(`- Deleted Employer and ${jobIds.length} Jobs.`);
      }

      await pgClient.query(`DELETE FROM "public"."User" WHERE id = $1`, [userId]);
      console.log(`- Deleted User record.`);
    }

    // 2. Delete from Supabase Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError) {
      const authUser = users.find(u => u.email === email);
      if (authUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        console.log(`- Deleted Auth user: ${authUser.id}`);
      }
    }

    // 3. Mark as not migrated in LegacyMember
    await pgClient.query(`UPDATE "public"."LegacyMember" SET is_migrated = false, updated_at = NOW() WHERE username = $1`, [username]);
    console.log(`✅ Reset complete for ${username}!`);
  } catch (error) {
    console.error(`❌ Reset failed:`, error);
  } finally {
    await pgClient.end();
  }
}

const targetId = process.argv[2];
if (targetId) resetMigration(targetId);
