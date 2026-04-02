import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * This route is intended to be called by a CRON job (e.g., every 5-10 minutes)
 * to process all jobs that are due for an auto-jump.
 */
export async function GET(req: Request) {
    try {
        // Simple security check: Verify a secret header if provided in .env
        const authHeader = req.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()

        // 1. Find jobs that:
        // - Have auto-jump enabled
        // - Have remaining auto-jumps > 0
        // - status is ACTIVE
        // - next_auto_jump_at is past (<= now)
        const pendingJobs = await prisma.job.findMany({
            where: {
                is_auto_jump_enabled: true,
                remaining_auto_jumps: { gt: 0 },
                status: 'ACTIVE',
                next_auto_jump_at: { lte: now }
            } as any,
            take: 50 // process in batches
        })

        console.log(`[AutoJumpCron] Found ${pendingJobs.length} jobs to jump.`)

        const results = []

        for (const job of pendingJobs) {
            try {
                // Update the job:
                // - Set last_jumped_at to now
                // - Decrement remaining_auto_jumps
                // - Schedule next_auto_jump_at based on auto_jump_interval_min
                const nextJump = new Date(now.getTime() + job.auto_jump_interval_min * 60000)

                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        last_jumped_at: now,
                        remaining_auto_jumps: { decrement: 1 },
                        next_auto_jump_at: nextJump
                    }
                })
                results.push({ id: job.id, success: true })
            } catch (err: any) {
                console.error(`[AutoJumpCron] Error jumping job ${job.id}:`, err)
                results.push({ id: job.id, success: false, error: err.message })
            }
        }

        return NextResponse.json({
            processed: results.length,
            success_count: results.filter(r => r.success).length,
            results
        })

    } catch (error: any) {
        console.error('[AutoJumpCron] FATAL ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
