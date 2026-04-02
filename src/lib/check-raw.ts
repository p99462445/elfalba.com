import pg from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkRaw() {
    const client = new pg.Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })

    try {
        await client.connect()
        const res = await client.query('SELECT "id", "user_id", "business_name" FROM "Employer"')
        console.log('--- Employers ---')
        console.table(res.rows)

        const resUsers = await client.query('SELECT "id", "email", "role" FROM "User"')
        console.log('--- Users ---')
        console.table(resUsers.rows)
    } catch (err: any) {
        console.error(err.message)
    } finally {
        await client.end()
    }
}

checkRaw()
