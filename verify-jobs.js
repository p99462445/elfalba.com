
const { Client } = require('pg');
async function run() {
    const c = new Client({ connectionString: 'postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
    await c.connect();
    const r = await c.query('SELECT name, (SELECT count(*) FROM "Job" WHERE employer_id IN (SELECT id FROM "Employer" WHERE user_id = u.id)) as job_count FROM "User" u WHERE u.email = \'clon0443@badalba.com\'');
    console.table(r.rows);
    await c.end();
}
run();
