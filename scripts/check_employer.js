const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT * FROM "Employer" WHERE id = $1', ['6dfc0880-fa9a-48ff-ab43-f8702ff0fd65']);
        console.log('Employer check:', JSON.stringify(res.rows, null, 2));

        const userRes = await client.query('SELECT * FROM "User"'); // Let's see who is registered
        console.log('Users:', JSON.stringify(userRes.rows.map(u => ({ id: u.id, email: u.email })), null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
