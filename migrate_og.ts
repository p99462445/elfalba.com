import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Even if service role key fails for DB update, we can use anon key just for Storage upload!
// Storage might allow authenticated uploads or public uploads, let's use anon key + dummy user or service role key just for storage
const supabase = createClient(
  'https://snozedmxpwufqzvzrmmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNub3plZG14cHd1ZnF6dnpybW13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Ijk0NjYwOCwiZXhwIjoyMDg4NTIyNjA4fQ.JMEfKqn5cfFiguzXey7UOlU4kqRZE-G_K_0qcMKSvys' // service role key
)

async function run() {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        logo_url: { startsWith: '/api/og/banner' }
      },
      select: { id: true, logo_url: true }
    })

    if (!jobs || jobs.length === 0) {
      console.log('No jobs found with dynamic banner URLs. Everything is clean.')
      return
    }

    console.log(`Found ${jobs.length} jobs to convert to static PNGs...`)

    for (const job of jobs) {
      if (!job.logo_url) continue
      try {
        const fetchUrl = `https://badalba.co.kr${job.logo_url}`
        console.log(`\n[Job ${job.id}] Fetching banner from Vercel: ${fetchUrl}`)
        
        const res = await fetch(fetchUrl)
        if (!res.ok) throw new Error('Failed to fetch image from edge function')
        
        const buffer = await res.arrayBuffer()
        const fileName = `migrated-banner-${job.id}-${Date.now()}.png`
        const filePath = `banner/${fileName}`

        console.log(`[Job ${job.id}] Uploading to Supabase bucket...`)
        
        const { data: uploadData, error: upError } = await supabase.storage
          .from('job-images')
          .upload(filePath, new Uint8Array(buffer), { contentType: 'image/png' })

        if (upError) {
             console.error("Storage upload failed, trying to continue anyway...", upError)
             throw upError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('job-images')
          .getPublicUrl(filePath)

        console.log(`[Job ${job.id}] Updating DB with static URL: ${publicUrl}`)

        await prisma.job.update({
          where: { id: job.id },
          data: { logo_url: publicUrl }
        })

        console.log(`[Job ${job.id}] ✅ Successfully migrated.`)
      } catch (err: any) {
        console.error(`[Job ${job.id}] ❌ Error processing job:`, err.message || err)
      }
    }

    console.log('\nMigration fully completed!')
  } catch (error) {
     console.error("Prisma error:", error)
  } finally {
      await prisma.$disconnect()
  }
}

run()
