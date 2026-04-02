import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin Check
    const isAdmin = user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com' || user?.email === 'admin@elfalba.com';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const jobNo = searchParams.get('jobNo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (jobId) where.job_id = jobId
    if (jobNo) {
        where.job = { job_no: parseInt(jobNo) }
    }

    try {
        const [logs, total] = await Promise.all([
            prisma.jobUpdateLog.findMany({
                where,
                include: {
                    job: {
                        select: { job_no: true, title: true, business_name: true }
                    },
                    user: {
                        select: { email: true, name: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.jobUpdateLog.count({ where })
        ])

        return NextResponse.json({ logs, total, pages: Math.ceil(total / limit) })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
