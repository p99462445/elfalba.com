
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

    const username = 'kkhhss2501';
    
    // 1. Find Current User and Employer
    const uRes = await client.query('SELECT id FROM "public"."User" WHERE old_id = $1', [username]);
    const currentUserId = uRes.rows[0]?.id;
    console.log('Current User ID:', currentUserId);

    if (!currentUserId) {
        console.error('No current user found with old_id = kkhhss2501');
        await client.end();
        return;
    }

    const currentERes = await client.query('SELECT id FROM "public"."Employer" WHERE user_id = $1', [currentUserId]);
    const currentEmployerId = currentERes.rows[0]?.id;
    console.log('Current Employer ID (Empty):', currentEmployerId);

    // 2. Find Old (Orphaned) Employer
    // It should be linked to the "dummy" user I created during reset
    const oldERes = await client.query('SELECT id, user_id FROM "public"."Employer" WHERE user_id IN (SELECT id FROM "public"."User" WHERE email LIKE $1)', [`${username}_reset_%`]);
    const oldEmployer = oldERes.rows[0];

    if (oldEmployer) {
        console.log('Found Old Employer with data:', oldEmployer.id, 'currently linked to:', oldEmployer.user_id);
        
        // 3. RE-LINKING PROCESS
        await client.query('BEGIN');
        try {
            // A. Move the OLD employer to point to the CURRENT user
            // But we must address the unique constraint on user_id in Employer table.
            // So we delete the New Empty Employer first.
            if (currentEmployerId) {
                console.log('- Deleting current empty employer...');
                await client.query('DELETE FROM "public"."Employer" WHERE id = $1', [currentEmployerId]);
            }

            console.log('- Re-linking old employer to current user...');
            await client.query('UPDATE "public"."Employer" SET user_id = $1 WHERE id = $2', [currentUserId, oldEmployer.id]);
            
            // B. Clean up the orphaned dummy user
            console.log('- Cleaning up orphaned dummy user...');
            await client.query('DELETE FROM "public"."User" WHERE id = $1', [oldEmployer.user_id]);

            await client.query('COMMIT');
            console.log('\n>>> SUCCESS: Jobs and Employer data re-linked for kkhhss2501.');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('FAILED to re-link:', err);
        }
    } else {
        console.log('No old employer found to re-link.');
    }

    await client.end();
}

run().catch(console.error);
