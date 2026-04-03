const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query(`
            UPDATE "SiteConfig" 
            SET footer_report_num = '2022-서울송파-2449' 
            WHERE id = 'default'
        `);
        console.log('SiteConfig updated:', res.rowCount);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
