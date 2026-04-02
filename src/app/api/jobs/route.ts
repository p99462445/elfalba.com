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

        let employer = await prisma.employer.findUnique({
            where: { user_id: user.id }
        })

        if (!employer) {
            employer = await prisma.employer.create({
                data: {
                    user_id: user.id,
                    business_name: '신규 업소',
                }
            })
        }

        const body = await req.json()
        const {
            title, description,
            salaryType, salaryAmount, salaryInfo,
            convenienceTags, ageMin, ageMax, gender,
            contactInfo, regionSlugs, categorySlug,
            managerName, businessName, kakaoId, telegramId, lineId,
            workingType, employmentType,
            imageUrls, logoUrl // Added logoUrl
        } = body

        if (!regionSlugs || regionSlugs.length === 0) {
            return NextResponse.json({ error: 'At least one region is required' }, { status: 400 })
        }

        // Resolve Region and Category IDs
        const [regions, category] = await Promise.all([
            prisma.region.findMany({ where: { slug: { in: regionSlugs } } }),
            prisma.jobCategory.findFirst({ where: { slug: categorySlug } })
        ])

        if (regions.length === 0 || !category) {
            return NextResponse.json({ error: 'Invalid region or category' }, { status: 400 })
        }

        // Create the Job with multiple regions and images
        const job = await prisma.job.create({
            data: {
                employer_id: employer.id,
                category_id: Number(category.id),
                region_id: regions[0] ? Number(regions[0].id) : null,
                title: String(title || ''),
                business_name: businessName ? String(businessName) : null,
                description: String(description || ''),
                manager_name: managerName ? String(managerName) : null,
                kakao_id: kakaoId ? String(kakaoId) : null,
                telegram_id: telegramId ? String(telegramId) : null,
                line_id: lineId ? String(lineId) : null,
                salary_type: salaryType as any,
                salary_amount: typeof salaryAmount === 'string' ? Number(salaryAmount.replace(/,/g, '')) || 0 : Number(salaryAmount) || 0,
                salary_info: salaryInfo ? String(salaryInfo) : null,
                working_type: workingType ? String(workingType) : "파트타임 / 단기",
                employment_type: employmentType ? String(employmentType) : "고용",
                contact_value: String(contactInfo || ''),
                contact_info: String(contactInfo || ''),
                convenience_tags: Array.isArray(convenienceTags) ? convenienceTags : [],
                age_min: ageMin ? Number(ageMin) : null,
                age_max: ageMax ? Number(ageMax) : null,
                gender: String(gender || '무관'),
                status: 'PENDING', // Force pending for payment flow
                logo_url: logoUrl ? String(logoUrl) : null,
                regions: {
                    create: regions.map(r => ({
                        region_id: Number(r.id)
                    }))
                },
                images: imageUrls && imageUrls.length > 0 ? {
                    create: imageUrls.map((url: string) => ({
                        image_url: String(url)
                    }))
                } : undefined
            },
            include: { regions: true, images: true }
        })

        return NextResponse.json({ message: '공고가 성공적으로 등록되었습니다.', data: { id: job.id } })

    } catch (error: any) {
        console.error("JOB POST ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET: Fetch all active jobs (for listing pages)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const regionSlug = searchParams.get('region')
    const categorySlug = searchParams.get('category')
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 30
    const now = new Date()

    try {
        // --- PASSIVE AUTO-JUMP TRIGGER (THROTTLED) ---
        // To preserve Vercel free limits and Supabase DB requests, only check for jumps on ~25% of requests.
        // It's effectively passive and will still catch up very quickly with moderate traffic.
        if (Math.random() < 0.25) {
            const dueJobs = await prisma.job.findMany({
                where: {
                    status: 'ACTIVE',
                    is_auto_jump_enabled: true,
                    remaining_auto_jumps: { gt: 0 },
                    next_auto_jump_at: { lte: now }
                },
                take: 10 // Reduce batch size to keep DB extremely fast
            })

            if (dueJobs.length > 0) {
                // Run updates in parallel
                await Promise.all(dueJobs.map(job => {
                    const nextJump = new Date(now.getTime() + (job.auto_jump_interval_min || 144) * 60000)
                    return prisma.job.update({
                        where: { id: job.id },
                        data: {
                            last_jumped_at: now,
                            remaining_auto_jumps: { decrement: 1 },
                            next_auto_jump_at: nextJump
                        }
                    })
                }))
                console.log(`[PASSIVE JUMP] Executed ${dueJobs.length} jumps for user ${req.url}`)
            }
        }
        // ---------------------------------

        const where: any = { 
            status: 'ACTIVE',
            AND: [
                {
                    OR: [
                        { normal_expired_at: { gt: new Date() } },
                        { normal_expired_at: null }
                    ]
                }
            ]
        }

        // Revised region filter for hierarchical and multiple regions
        if (regionSlug && regionSlug !== 'all') {
            const requestedRegion = await prisma.region.findUnique({
                where: { slug: regionSlug },
                include: { children: true }
            })

            if (requestedRegion) {
                const regionSlugsToInclude = [requestedRegion.slug, ...requestedRegion.children.map(c => c.slug)]

                where.AND.push({
                    OR: [
                        { region: { slug: { in: regionSlugsToInclude } } },
                        { regions: { some: { region: { slug: { in: regionSlugsToInclude } } } } }
                    ]
                })
            }
        }

        if (categorySlug && categorySlug !== 'all') {
            where.category = { slug: categorySlug }
        }

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                include: { employer: true, region: true, category: true, regions: { include: { region: true } } } as any,
                orderBy: sort === 'salary' ? { salary_amount: 'desc' } : { last_jumped_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.job.count({ where })
        ])

        return NextResponse.json({ jobs, total, page, limit })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
