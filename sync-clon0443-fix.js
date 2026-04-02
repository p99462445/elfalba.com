
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fix() {
    const client = new Client({
        connectionString: "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const username = 'clon0443';
    const email = `${username}@badalba.com`;

    // 1. Find the NEW user ID (migrated/created)
    const newRes = await client.query('SELECT id FROM "User" WHERE email = $1 AND old_id = $2', [email, username]);
    const newUserId = newRes.rows[0]?.id;

    // 2. Find the OLD backup user ID (which has the employer/jobs)
    const oldRes = await client.query('SELECT id FROM "User" WHERE email LIKE $1 AND old_id IS NULL', [`backup_%_${username}@badalba.com`]);
    const oldUserId = oldRes.rows[0]?.id;

    console.log(`NEW User ID: ${newUserId}`);
    console.log(`OLD User ID: ${oldUserId}`);

    if (newUserId && oldUserId) {
        console.log(`\n>>> MOVING DATA FROM ${oldUserId} TO ${newUserId}...`);

        // Check if new user already has an employer (shouldn't)
        const checkNewEmp = await client.query('SELECT id FROM "Employer" WHERE user_id = $1', [newUserId]);
        if (checkNewEmp.rows.length === 0) {
            // MOVE SUCCESS!
            const updEmployer = await client.query('UPDATE "Employer" SET user_id = $1 WHERE user_id = $2', [newUserId, oldUserId]);
            console.log(`- Employer records moved: ${updEmployer.rowCount}`);

            // Also move common relations
            await client.query('UPDATE "Payment" SET user_id = $1 WHERE user_id = $2', [newUserId, oldUserId]);
            await client.query('UPDATE "Bookmark" SET user_id = $1 WHERE user_id = $2', [newUserId, oldUserId]);
            await client.query('UPDATE "Post" SET user_id = $1 WHERE user_id = $2', [newUserId, oldUserId]);
            await client.query('UPDATE "Comment" SET user_id = $1 WHERE user_id = $2', [newUserId, oldUserId]);
            
            console.log(`- All associated data synced!`);

            // Cleanup OLD backup user
            await client.query('DELETE FROM "User" WHERE id = $1', [oldUserId]);
            console.log(`- Cleanup: Deleted old backup user record.`);
        } else {
            console.log("X - New user already has an employer record. Syncing jobs directly...");
            const sourceEmployerRes = await client.query('SELECT id FROM "Employer" WHERE user_id = $1', [oldUserId]);
            const sourceEmployerId = sourceEmployerRes.rows[0]?.id;
            const targetEmployerId = checkNewEmp.rows[0].id;
            if (sourceEmployerId) {
                const updJobs = await client.query('UPDATE "Job" SET employer_id = $1 WHERE employer_id = $2', [targetEmployerId, sourceEmployerId]);
                console.log(`- Jobs moved: ${updJobs.rowCount}`);
            }
        }
    } else {
        console.error("X - Could not find both new and old user IDs. Please check manually.");
    }

    await client.end();
}

fix().catch(console.error);
