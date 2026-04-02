
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
    
    const res = await client.query('SELECT title, business_name, manager_name, contact_value FROM "public"."Job" WHERE employer_id = (SELECT id FROM "public"."Employer" WHERE user_id = (SELECT id FROM "public"."User" WHERE old_id = \'kkhhss2501\'))');
    console.log(res.rows);
    await client.end();
}
run();
