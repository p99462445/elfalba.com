
const { Client } = require('pg');

async function checkUser() {
  const directUrl = "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  const client = new Client({
    connectionString: directUrl,
  });

  await client.connect();
  try {
    const id = 'clon0443';
    console.log(`Checking status for user: ${id}`);
    
    // Check in users table
    const userRes = await client.query(`
      SELECT id, email, nickname, is_migrated, is_temp_password 
      FROM users 
      WHERE email = $1 OR nickname = $2
    `, [`${id}@badalba.com`, id]);
    
    if (userRes.rows.length === 0) {
      console.log("User NOT FOUND in 'users' table.");
    } else {
      console.log("User found in 'users' table:");
      console.table(userRes.rows);
      
      const jobsRes = await client.query(`SELECT COUNT(*) FROM jobs WHERE user_id = $1`, [userRes.rows[0].id]);
      console.log(`Associated Job Postings: ${jobsRes.rows[0].count}`);
    }

  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await client.end();
  }
}

checkUser();
