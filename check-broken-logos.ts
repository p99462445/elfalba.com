import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking database for jobs with hardcoded absolute URLs in logo_url...')

    // Find logos hardcoded to the production domain
    const prodHardcoded = await prisma.job.findMany({
        where: { logo_url: { contains: 'badalba.co.kr' } },
        select: { id: true, title: true, logo_url: true }
    })

    // Find logos hardcoded to localhost
    const localHardcoded = await prisma.job.findMany({
        where: { logo_url: { contains: 'localhost' } },
        select: { id: true, title: true, logo_url: true }
    })

    const allIssues = [...prodHardcoded, ...localHardcoded]

    console.log(`\n⚠️ Found ${allIssues.length} jobs that need logo URL correction.`)

    if (allIssues.length > 0) {
        console.log('\n--- Details of the affected jobs ---')
        allIssues.forEach((job, idx) => {
            console.log(`[${idx + 1}] ID: ${job.id}`)
            console.log(`    Title: ${job.title}`)
            console.log(`    Current Logo URL: ${job.logo_url}`)
        })
        console.log('------------------------------------')
    } else {
        console.log('✅ All logo URLs are clean and seem to be correctly formatted as relative paths.')
    }
}

main().catch(e => {
    console.error('Script Error:', e)
}).finally(() => {
    prisma.$disconnect()
})
