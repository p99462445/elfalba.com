import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
    const jobs = await prisma.job.findMany({
        where: {
            logo_url: {
                startsWith: '/api/og/banner'
            }
        }
    })
    console.log(`Found ${jobs.length} jobs with dynamic Vercel banner URLs.`)
    for (const j of jobs) {
        console.log(`Job ID: ${j.id}, URL: ${j.logo_url}`)
    }
}

check().catch(console.error).finally(() => prisma.$disconnect())
