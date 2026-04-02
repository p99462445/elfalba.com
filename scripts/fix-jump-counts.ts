import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = (process.env.DATABASE_URL || '').trim().replace(/[\r\n]/g, '')
if (!connectionString) {
    console.error("ERORR: DATABASE_URL not found!")
    process.exit(1)
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function run() {
    console.log('--- Proportional Jump Calculation (V3 - Final with Adapter) ---')
    console.log('Ratio (30 Days): VVIP: 1300, VIP: 800, GEN: 300\n')

    const now = new Date()

    const jobs = await prisma.job.findMany({
        where: {
            status: 'ACTIVE'
        }
    })

    console.log(`Analyzing ${jobs.length} total active jobs...`)

    for (const job of jobs) {
        if (job.remaining_auto_jumps > 0) continue
        if (!job.expired_at) continue

        const expiry = new Date(job.expired_at)
        const diffMs = expiry.getTime() - now.getTime()

        if (diffMs <= 0) continue

        const remainingDays = diffMs / (1000 * 60 * 60 * 24)

        let dailyQuota = 300 / 30
        if (job.exposure_level === 'VVIP') dailyQuota = 1300 / 30
        else if (job.exposure_level === 'VIP') dailyQuota = 800 / 30

        const proportionalJumps = Math.floor(dailyQuota * remainingDays)

        if (proportionalJumps <= 0) continue

        const remainingMins = Math.floor(diffMs / 60000)
        let interval = Math.floor(remainingMins / proportionalJumps)
        interval = Math.max(5, Math.min(1440, interval))

        await prisma.job.update({
            where: { id: job.id },
            data: {
                remaining_auto_jumps: proportionalJumps,
                auto_jump_interval_min: interval,
                is_auto_jump_enabled: true,
                next_auto_jump_at: new Date(now.getTime() + 5000)
            }
        })

        console.log(`[OK] Job ${job.job_no} (${job.exposure_level}): ${remainingDays.toFixed(1)} days -> ${proportionalJumps} jumps (${interval}m)`)
    }

    console.log('\n--- Corrected Sucessfully ---')
}

run()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
