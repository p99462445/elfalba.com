import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// 로그용 공고 데이터 스냅샷 생성 함수
const getJobSnapshot = (job: any) => ({
    title: job.title,
    business_name: job.business_name,
    description: job.description,
    category_id: job.category_id,
    salary_type: job.salary_type,
    salary_amount: job.salary_amount,
    salary_info: job.salary_info,
    age_min: job.age_min,
    age_max: job.age_max,
    gender: job.gender,
    working_type: job.working_type,
    contact_info: job.contact_info,
    manager_name: job.manager_name,
    status: job.status,
    exposure_level: job.exposure_level,
    official_business_name: job.official_business_name,
    business_address: job.business_address,
    business_owner_name: job.business_owner_name,
    banner_url: job.banner_url,
    vvip_expired_at: job.vvip_expired_at ? new Date(job.vvip_expired_at).toISOString() : null,
    vip_expired_at: job.vip_expired_at ? new Date(job.vip_expired_at).toISOString() : null,
    normal_expired_at: job.normal_expired_at ? new Date(job.normal_expired_at).toISOString() : null,
})

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                region: true,
                category: true,
                images: true,
                regions: {
                    include: { region: true }
                },
                employer: {
                    include: { user: true }
                },
                payments: {
                    include: { product: true },
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            }
        })

        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

        return NextResponse.json(job)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: jobId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const {
            title,
            description,
            salaryType,
            salaryAmount,
            salaryInfo,
            categorySlug,
            regionSlugs,
            ageMin,
            ageMax,
            gender,
            contactInfo,
            managerName,
            businessName,
            kakaoId,
            telegramId,
            lineId,
            logoUrl,
            imageUrls,
            status,
            exposureLevel,
            remainingAutoJumps,
            autoJumpIntervalMin,
            expiredAt,
            vvip_expired_at,
            vip_expired_at,
            normal_expired_at,
            officialBusinessName,
            businessAddress,
            businessOwnerName,
            bannerUrl
        } = body

        // Verify ownership (Skip if ADMIN)
        const existingJob = await prisma.job.findUnique({
            where: { id: jobId },
            include: { employer: true }
        })

        if (!existingJob) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

        // Check if user is Admin
        const isAdmin = user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com' || user?.email === 'admin@elfalba.com';

        if (!isAdmin) {
            const employer = await prisma.employer.findUnique({
                where: { user_id: user.id }
            })

            if (!employer || existingJob.employer_id !== employer.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const category = await prisma.jobCategory.findUnique({ where: { slug: categorySlug } })
        if (!category) throw new Error('Invalid category')

        const adminData: any = {}
        if (isAdmin) {
            if (status !== undefined) adminData.status = status
            if (exposureLevel !== undefined) adminData.exposure_level = exposureLevel
            if (remainingAutoJumps !== undefined) adminData.remaining_auto_jumps = Number(remainingAutoJumps)
            if (autoJumpIntervalMin !== undefined) adminData.auto_jump_interval_min = Number(autoJumpIntervalMin)
            if (expiredAt !== undefined) {
                adminData.expired_at = expiredAt ? new Date(expiredAt) : null
            }
            if (vvip_expired_at !== undefined) adminData.vvip_expired_at = vvip_expired_at ? new Date(vvip_expired_at) : null
            if (vip_expired_at !== undefined) adminData.vip_expired_at = vip_expired_at ? new Date(vip_expired_at) : null
            if (normal_expired_at !== undefined) adminData.normal_expired_at = normal_expired_at ? new Date(normal_expired_at) : null
            
            // Recalculate max legacy expired_at to maintain consistency
            if (vvip_expired_at !== undefined || vip_expired_at !== undefined || normal_expired_at !== undefined) {
                const datesToMax = [adminData.vvip_expired_at, adminData.vip_expired_at, adminData.normal_expired_at].filter(Boolean)
                if (datesToMax.length > 0) {
                    adminData.expired_at = new Date(Math.max(...datesToMax.map((d: any) => d.getTime())))
                } else {
                    adminData.expired_at = null
                }
            }

            // 추가 비즈니스 정보 (관리자 전용)
            if (officialBusinessName !== undefined) adminData.official_business_name = officialBusinessName
            if (businessAddress !== undefined) adminData.business_address = businessAddress
            if (businessOwnerName !== undefined) adminData.business_owner_name = businessOwnerName
            if (bannerUrl !== undefined) adminData.banner_url = bannerUrl
        }

        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: {
                title,
                business_name: businessName,
                description,
                salary_type: salaryType,
                salary_amount: Number(salaryAmount) || 0,
                salary_info: salaryInfo,
                category_id: category.id,
                age_min: ageMin ? Number(ageMin) : null,
                age_max: ageMax ? Number(ageMax) : null,
                gender,
                contact_info: contactInfo,
                contact_value: contactInfo || '',
                manager_name: managerName,
                kakao_id: kakaoId,
                telegram_id: telegramId,
                line_id: lineId,
                logo_url: logoUrl,
                ...adminData
            } as any
        })

        // Simple region update
        if (regionSlugs !== undefined) {
            await prisma.jobRegion.deleteMany({ where: { job_id: jobId } })
            if (regionSlugs.length > 0) {
                const regions = await prisma.region.findMany({ where: { slug: { in: regionSlugs } } })
                await prisma.jobRegion.createMany({
                    data: regions.map((r: any) => ({ job_id: jobId, region_id: r.id }))
                })
            }
        }

        // Handle Image updates
        if (imageUrls) {
            await prisma.jobImage.deleteMany({ where: { job_id: jobId } })
            await prisma.jobImage.createMany({
                data: imageUrls.map((url: string) => ({
                    job_id: jobId,
                    image_url: url
                }))
            })
        }

        // --- 수정 로그 기록 시작 ---
        try {
            const beforeSnapshot = getJobSnapshot(existingJob)
            const afterSnapshot = getJobSnapshot(updatedJob)
            const changedFields: string[] = []
            
            Object.keys(beforeSnapshot).forEach(key => {
                const beforeVal = (beforeSnapshot as any)[key]
                const afterVal = (afterSnapshot as any)[key]
                if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
                    changedFields.push(key)
                }
            })

            if (changedFields.length > 0) {
                await prisma.jobUpdateLog.create({
                    data: {
                        job_id: jobId,
                        user_id: user?.id || null,
                        before_data: beforeSnapshot,
                        after_data: afterSnapshot,
                        changed_fields: changedFields,
                        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
                    }
                })
            }
        } catch (logError) {
            console.error('Failed to create job update log:', logError)
        }
        // --- 수정 로그 기록 종료 ---

        return NextResponse.json(updatedJob)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: jobId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const existingJob = await prisma.job.findUnique({
            where: { id: jobId },
            include: { employer: true }
        })

        if (!existingJob) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

        // Check if user is Admin
        const isAdmin = user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com' || user?.email === 'admin@elfalba.com';

        if (!isAdmin) {
            const employer = await prisma.employer.findUnique({
                where: { user_id: user.id }
            })

            if (!employer || existingJob.employer_id !== employer.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        // 1. Delete related metadata through Prisma (some don't have cascade in schema)
        await prisma.bookmark.deleteMany({ where: { job_id: jobId } })
        await prisma.autoJump.deleteMany({ where: { job_id: jobId } })
        await prisma.jobApplication.deleteMany({ where: { job_id: jobId } })

        // 2. Handle Payments: Delete PENDING, keep others (they will have job_id set to null)
        await prisma.payment.deleteMany({
            where: {
                job_id: jobId,
                status: 'PENDING'
            }
        })

        // 3. Delete the job itself
        await prisma.job.delete({ where: { id: jobId } })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
