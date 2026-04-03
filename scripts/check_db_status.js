const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'Job';
        `);
        console.log('Job table columns:', JSON.stringify(res.rows, null, 2));

        const enumRes = await client.query(`
            SELECT e.enumlabel 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname = 'SalaryType';
        `);
        console.log('SalaryType enum values:', JSON.stringify(enumRes.rows.map(r => r.enumlabel), null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
