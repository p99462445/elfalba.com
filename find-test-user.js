
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function findTestUsers() {
  await client.connect();
  try {
    console.log("Finding users with job postings...");
    
    // Find users who have jobs and check their migration status
    // Assuming legacy users have migration_status or similar, 
    // or we check if they exist in auth.users
    const query = `
      SELECT 
        u.id, 
        u.email, 
        u.name,
        u.nickname,
        u.is_migrated,
        (SELECT COUNT(*) FROM jobs WHERE user_id = u.id) as job_count
      FROM users u
      WHERE (SELECT COUNT(*) FROM jobs WHERE user_id = u.id) > 0
      ORDER BY job_count DESC
      LIMIT 10;
    `;

    const res = await client.query(query);
    console.table(res.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

findTestUsers();
