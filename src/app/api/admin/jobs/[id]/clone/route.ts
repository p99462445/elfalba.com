import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json().catch(() => ({}));
        const includeDates = body.includeDates === true;
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const adminUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (adminUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // 1. Fetch original job
        const job = await prisma.job.findUnique({
            where: { id },
            include: { regions: true, images: true }
        })

        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

        // 2. Clone job
        const newJob = await prisma.job.create({
            data: {
                employer_id: job.employer_id,
                category_id: job.category_id,
                region_id: job.region_id,
                title: `${job.title} (복사본)`,
                description: job.description,
                qualifications: job.qualifications,
                manager_name: job.manager_name,
                kakao_id: job.kakao_id,
                telegram_id: job.telegram_id,
                line_id: job.line_id,
                salary_type: job.salary_type,
                salary_amount: job.salary_amount,
                salary_info: job.salary_info,
                working_type: job.working_type,
                employment_type: job.employment_type,
                work_time: job.work_time,
                working_hours: job.working_hours,
                contact_type: job.contact_type,
                contact_value: job.contact_value,
                contact_info: job.contact_info,
                convenience_tags: job.convenience_tags,
                age_min: job.age_min,
                age_max: job.age_max,
                gender: job.gender,
                status: includeDates ? job.status : 'PENDING',
                exposure_level: includeDates ? job.exposure_level : 'GENERAL',
                logo_url: job.logo_url,
                view_count: 0,
                last_jumped_at: new Date(),
                remaining_auto_jumps: includeDates ? job.remaining_auto_jumps : 0,
                auto_jump_interval_min: job.auto_jump_interval_min,
                vvip_expired_at: includeDates ? job.vvip_expired_at : null,
                vip_expired_at: includeDates ? job.vip_expired_at : null,
                normal_expired_at: includeDates ? job.normal_expired_at : null,
                expired_at: includeDates ? job.expired_at : null,
            }
        })

        // 3. Clone regions relations
        if (job.regions.length > 0) {
            await prisma.jobRegion.createMany({
                data: job.regions.map(r => ({ job_id: newJob.id, region_id: r.region_id }))
            })
        }

        // 4. Clone images
        if (job.images.length > 0) {
            await prisma.jobImage.createMany({
                data: job.images.map(i => ({ job_id: newJob.id, image_url: i.image_url }))
            })
        }

        return NextResponse.json({ success: true, newJobId: newJob.id })
    } catch (error: any) {
        console.error('Clone logic error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
