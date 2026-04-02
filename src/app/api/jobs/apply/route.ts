import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        const body = await req.json()
        const { jobId, resumeText } = body

        if (!jobId) {
            return NextResponse.json({ error: '공고 ID가 필요합니다.' }, { status: 400 })
        }

        // 1. Check if already applied
        const existing = await prisma.jobApplication.findFirst({
            where: {
                job_id: jobId,
                user_id: user.id
            }
        })

        if (existing) {
            return NextResponse.json({ error: '이미 지원한 공고입니다.' }, { status: 400 })
        }

        // 2. Create Application
        const application = await prisma.jobApplication.create({
            data: {
                job_id: jobId,
                user_id: user.id,
                resume_text: resumeText || '새로운 지원입니다.',
                status: 'NEW'
            }
        })

        return NextResponse.json({
            success: true,
            message: '성공적으로 지원되었습니다.',
            data: application
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
