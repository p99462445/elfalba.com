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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'ALL'
    const showOnlyActive = searchParams.get('showOnlyActive') === 'true'
    const sort = searchParams.get('sort') || 'created_at'
    const direction = searchParams.get('direction') || 'desc'

    const where: any = {}

    if (showOnlyActive) {
        where.OR = [
            { vvip_expired_at: { gt: new Date() } },
            { vip_expired_at: { gt: new Date() } },
            { normal_expired_at: { gt: new Date() } }
        ]
    }
    
    if (search) {
        const searchVal = search.trim();
        if (filter === 'JOB_NO' && !isNaN(parseInt(searchVal))) {
            where.job_no = parseInt(searchVal)
        } else if (filter === 'USER_ID') {
            where.employer = { user: { email: { contains: searchVal, mode: 'insensitive' } } }
        } else if (filter === 'NAME') {
            where.OR = [
                { manager_name: { contains: searchVal, mode: 'insensitive' } },
                { employer: { owner_name: { contains: searchVal, mode: 'insensitive' } } }
            ]
        } else if (filter === 'BIZ_NAME') {
            where.employer = { business_name: { contains: searchVal, mode: 'insensitive' } }
        } else if (filter === 'TITLE') {
            where.title = { contains: searchVal, mode: 'insensitive' }
        } else if (filter === 'ALL') {
            where.OR = [
                { title: { contains: searchVal, mode: 'insensitive' } },
                { manager_name: { contains: searchVal, mode: 'insensitive' } },
                { employer: { business_name: { contains: searchVal, mode: 'insensitive' } } },
                { employer: { user: { email: { contains: searchVal, mode: 'insensitive' } } } }
            ]
            if (!isNaN(parseInt(searchVal))) {
                where.OR.push({ job_no: parseInt(searchVal) })
            }
        }
    }

    const orderBy: any = {}
    if (sort === 'grade') {
        // Simple fallback, complex ordering by ENUM is harder in raw Prisma without rawQuery
        orderBy.exposure_level = direction === 'asc' ? 'asc' : 'desc'
    } else if (sort === 'expired_at') {
        // Furthest expiration first if desc
        orderBy.vvip_expired_at = direction === 'asc' ? 'asc' : 'desc'
    } else {
        orderBy[sort] = direction === 'asc' ? 'asc' : 'desc'
    }

    try {
        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                orderBy,
                include: {
                    employer: {
                        include: { user: true }
                    },
                    category: true,
                    region: true,
                    images: true
                },
                skip,
                take: limit
            }),
            prisma.job.count({ where })
        ])

        const serializedJobs = jobs.map(job => ({
            ...job,
            job_no: job.job_no,
            created_at: job.created_at.toISOString(),
            updated_at: job.updated_at.toISOString(),
            last_jumped_at: job.last_jumped_at?.toISOString() || null,
            expired_at: job.expired_at?.toISOString() || null,
            next_auto_jump_at: job.next_auto_jump_at?.toISOString() || null,
            vvip_expired_at: job.vvip_expired_at?.toISOString() || null,
            vip_expired_at: job.vip_expired_at?.toISOString() || null,
            normal_expired_at: job.normal_expired_at?.toISOString() || null,
            logo_url: job.logo_url,
            images: job.images.map(img => img.image_url),
            view_count: job.view_count,
            exposure_level: job.exposure_level,
            remaining_auto_jumps: job.remaining_auto_jumps,
            employer: job.employer ? {
                id: job.employer.id,
                business_name: job.employer.business_name,
                owner_name: job.employer.owner_name,
                phone: job.employer.phone,
                user: job.employer.user ? {
                    id: job.employer.user.id,
                    email: job.employer.user.email,
                    name: job.employer.user.nickname,
                    phone: job.employer.user.phone
                } : null
            } : null,
            category: job.category ? { name: job.category.name } : null,
            region: job.region ? { name: job.region.name } : null
        }));

        return NextResponse.json({ 
            jobs: serializedJobs, 
            total, 
            pages: Math.ceil(total / limit) 
        })
    } catch (error: any) {
        console.error('Admin Jobs API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
