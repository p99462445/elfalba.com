import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { jobId } = body

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
        }

        // 1. Get Employer
        const employer = await prisma.employer.findUnique({
            where: { user_id: user.id }
        })

        if (!employer) {
            return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
        }

        // 2. Locate Job and check ownership
        const job = await prisma.job.findUnique({
            where: { id: jobId }
        })

        if (!job || job.employer_id !== employer.id) {
            return NextResponse.json({ error: '공고를 찾을 수 없거나 권한이 없습니다.' }, { status: 403 })
        }

        // 3. Determine which point pool to use
        let updateJobData: any = { last_jumped_at: new Date() }
        let updateEmployerData: any = {}
        let poolUsed = ''

        if (job.remaining_auto_jumps > 0) {
            updateJobData.remaining_auto_jumps = { decrement: 1 }
            poolUsed = 'job'
        } else if (employer.jump_points > 0) {
            updateEmployerData.jump_points = { decrement: 1 }
            poolUsed = 'employer'
        } else {
            return NextResponse.json({ error: '사용 가능한 점프권이 없습니다. 포인트를 충전해 주세요.' }, { status: 403 })
        }

        // 4. Update in Transaction
        const { updatedJob, updatedEmployer } = await prisma.$transaction(async (tx) => {
            const upJob = await tx.job.update({
                where: { id: jobId },
                data: updateJobData
            })

            let upEmp = employer
            if (Object.keys(updateEmployerData).length > 0) {
                upEmp = await tx.employer.update({
                    where: { id: employer.id },
                    data: updateEmployerData
                })
            }

            return { updatedJob: upJob, updatedEmployer: upEmp }
        })

        return NextResponse.json({
            success: true,
            message: '성공적으로 1등으로 끌어올렸습니다!',
            remainingJobsPoints: updatedJob.remaining_auto_jumps,
            remainingUserPoints: updatedEmployer.jump_points,
            pool: poolUsed
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
