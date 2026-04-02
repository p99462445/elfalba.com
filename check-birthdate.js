
const { Client } = require('pg');
async function run() {
    const c = new Client({ connectionString: 'postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
    await c.connect();
    const r = await c.query("SELECT username, birthdate FROM \"LegacyMember\" WHERE username = 'clon0443'");
    console.log(r.rows[0]);
    await c.end();
}
run();
