
const { Client } = require('pg');

async function checkUser() {
  const directUrl = "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const id = 'clon0443';
    console.log(`\n--- Checking LegacyMember for: ${id} ---`);
    const legacyRes = await client.query('SELECT * FROM "LegacyMember" WHERE username = $1', [id]);
    console.table(legacyRes.rows);

    console.log(`\n--- Checking New User for: ${id} ---`);
    const email = `${id}@badalba.com`;
    const userRes = await client.query('SELECT id, email, nickname, old_id, is_adult FROM "User" WHERE old_id = $1 OR email = $2', [id, email]);
    console.table(userRes.rows);

    if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        const employerRes = await client.query('SELECT id, business_name FROM "Employer" WHERE user_id = $1', [userId]);
        console.log("Employer Data:");
        console.table(employerRes.rows);
        
        if (employerRes.rows.length > 0) {
            const jobsCount = await client.query('SELECT COUNT(*) FROM "Job" WHERE employer_id = $1', [employerRes.rows[0].id]);
            console.log(`Total Jobs: ${jobsCount.rows[0].count}`);
        }
    }

  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await client.end();
  }
}

checkUser();
