const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const cats = await pool.query('SELECT name FROM "JobCategory"');
        const regs = await pool.query('SELECT name FROM "Region" WHERE parent_id IS NULL');

        console.log('CATEGORIES:', cats.rows.map(r => r.name).join(', '));
        console.log('REGIONS:', regs.rows.map(r => r.name).join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
