import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
        }

        const resolvedParams = await params
        const jobId = resolvedParams.id
        const body = await req.json()
        const { isAutoJumpEnabled, intervalMin } = body

        // Verify ownership or Admin status
        const job = await prisma.job.findUnique({
            where: { id: jobId }
        })

        if (!job) {
            return NextResponse.json({ error: '공고를 찾을 수 없습니다.' }, { status: 404 })
        }

        // Check if employer or admin
        const employer = await prisma.employer.findUnique({ where: { user_id: user.id } })
        const isAdmin = user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com'

        if (!isAdmin && (!employer || job.employer_id !== employer.id)) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        const updateData: any = {}
        if (typeof isAutoJumpEnabled === 'boolean') {
            updateData.is_auto_jump_enabled = isAutoJumpEnabled
            // If turning on, schedule the next jump if not already scheduled
            if (isAutoJumpEnabled && !job.next_auto_jump_at) {
                const interval = intervalMin || job.auto_jump_interval_min || 144
                updateData.next_auto_jump_at = new Date(Date.now() + interval * 60000)
            }
        }
        if (typeof body.remainingAutoJumps === 'number') {
            updateData.remaining_auto_jumps = body.remainingAutoJumps
        }
        if (typeof intervalMin === 'number') {
            updateData.auto_jump_interval_min = intervalMin
            // Also reset next_auto_jump_at if enabled or just changed
            updateData.next_auto_jump_at = new Date(Date.now() + intervalMin * 60000)
        }

        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: updateData
        }) as any

        return NextResponse.json({
            success: true,
            message: '자동 점프 설정이 변경되었습니다.',
            job: {
                is_auto_jump_enabled: updatedJob.is_auto_jump_enabled,
                auto_jump_interval_min: updatedJob.auto_jump_interval_min
            }
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
