const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const cats = await pool.query('SELECT id, name FROM "JobCategory"');
        const regs = await pool.query('SELECT id, name FROM "Region" WHERE parent_id IS NULL');

        console.log('CAT_MAP:', JSON.stringify(cats.rows));
        console.log('REG_MAP:', JSON.stringify(regs.rows));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
