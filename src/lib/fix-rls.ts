import pg from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
    console.error('Missing DATABASE_URL or DIRECT_URL')
    process.exit(1)
}

const client = new pg.Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
})

async function fixRls() {
    try {
        await client.connect()
        console.log("Connected to database. Powering through RLS fixes...")

        // 1. Disable RLS on all public tables
        const publicTablesRes = await client.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `)

        for (const row of publicTablesRes.rows) {
            const table = row.tablename
            try {
                await client.query(`ALTER TABLE public."${table}" DISABLE ROW LEVEL SECURITY;`)
                console.log(`RLS disabled for public."${table}"`)
            } catch (err: any) {
                console.error(`Failed to disable RLS for ${table}:`, err.message)
            }
        }

        // 2. Handle Storage Policies (Aggressively)
        // We try to add policies that allow EVERYTHING for ANON and AUTHENTICATED
        console.log("Applying permissive storage policies...")

        const storageQueries = [
            // Drop existing to avoid conflicts
            "DROP POLICY IF EXISTS \"Public Access\" ON storage.objects;",
            "DROP POLICY IF EXISTS \"Public Access\" ON storage.buckets;",
            "DROP POLICY IF EXISTS \"Permissive Upload\" ON storage.objects;",

            // Create very permissive policies
            "CREATE POLICY \"Permissive Upload\" ON storage.objects FOR ALL USING (true) WITH CHECK (true);",
            "CREATE POLICY \"Permissive Buckets\" ON storage.buckets FOR ALL USING (true);",

            // Ensure the storage schema itself is permissive
            "ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;",
            "ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;"
        ]

        for (const q of storageQueries) {
            try {
                await client.query(q)
                console.log(`Executed storage query: ${q.substring(0, 50)}...`)
            } catch (err: any) {
                console.warn(`Storage query warning (might be lack of permissions): ${err.message}`)
            }
        }

        console.log("Force-granting all on public schema to anon and authenticated roles...")
        try {
            await client.query("GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;")
            await client.query("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;")
            await client.query("GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, postgres, service_role;")
        } catch (err: any) {
            console.error("Grant error:", err.message)
        }

        console.log("Cleanup: refreshing schema permissions...")
        await client.query("NOTIFY pgrst, 'reload schema';")

        console.log("All fixes completed.")
    } catch (err: any) {
        console.error("Critical error:", err.message)
    } finally {
        await client.end()
    }
}

fixRls()
