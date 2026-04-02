const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function checkIds() {
  const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await pgClient.connect();
  const cat = await pgClient.query(`SELECT id FROM "public"."JobCategory" LIMIT 1`);
  const reg = await pgClient.query(`SELECT id FROM "public"."Region" LIMIT 1`);
  console.log(JSON.stringify({ 
    category_id: cat.rows[0]?.id || 1, 
    region_id: reg.rows[0]?.id || 1 
  }));
  await pgClient.end();
}
checkIds();
