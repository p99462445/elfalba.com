const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT * FROM "JobCategory"');
        console.log('Categories:', JSON.stringify(res.rows, null, 2));

        const jobRes = await client.query('SELECT * FROM "Job" LIMIT 1');
        console.log('Sample Job:', JSON.stringify(jobRes.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
