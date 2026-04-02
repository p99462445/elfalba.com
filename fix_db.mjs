import pg from 'pg'
const { Client } = pg
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  'https://snozedmxpwufqzvzrmmw.supabase.co',
  'sb_publishable_MkWyat4vxMgDu37dfw1IJw_9nGMOujF' // using public key, storage upload should work if policy allows, or we just upload from browser if not. Wait, storage upload from nodejs with anon key fails if RLS is on for storage.
)

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  try {
    const res = await client.query(`SELECT id, logo_url FROM "Job" WHERE logo_url LIKE '/api/og/banner%'`)
    const jobs = res.rows
    
    if (jobs.length === 0) {
      console.log('No jobs found to convert.')
      return
    }
    
    console.log(`Found ${jobs.length} jobs to convert...`)

    for (const job of jobs) {
      const fetchUrl = `https://badalba.co.kr${job.logo_url}`
      console.log(`[Job ${job.id}] Fetching: ${fetchUrl}`)
      const imgRes = await fetch(fetchUrl)
      if (!imgRes.ok) throw new Error('Failed to fetch image')
      
      const buffer = await imgRes.arrayBuffer()
      const fileName = `migrated-banner-${job.id}-${Date.now()}.png`
      const filePath = `banner/${fileName}`

      // We'll save it locally instead to avoid Supabase anon key restrictions, or just try anon key first.
      console.log(`[Job ${job.id}] Uploading using anon key...`)
      const { data, error } = await supabase.storage.from('job-images').upload(filePath, new Uint8Array(buffer), { contentType: 'image/png' })
      
      if (error) {
         console.log('Upload failed with anon key. We will just save them locally in public/migrated_banners and update DB!')
         // Let's create directory
         if (!fs.existsSync('./public/migrated_banners')) {
             fs.mkdirSync('./public/migrated_banners', { recursive: true })
         }
         fs.writeFileSync(`./public/migrated_banners/${fileName}`, Buffer.from(buffer))
         const localUrl = `/migrated_banners/${fileName}`
         
         console.log(`Saved locally as ${localUrl}`)
         await client.query(`UPDATE "Job" SET logo_url = $1 WHERE id = $2`, [localUrl, job.id])
         console.log(`Updated DB for ${job.id}`)
      } else {
         const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(filePath)
         await client.query(`UPDATE "Job" SET logo_url = $1 WHERE id = $2`, [publicUrl, job.id])
         console.log(`Updated DB via Supabase for ${job.id}`)
      }
    }
    
    console.log('Done migrating all!')
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}

run()
