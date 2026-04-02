import React from 'react'
import prisma from '@/lib/prisma'
import DisplayTable from './DisplayTable'

export const dynamic = 'force-dynamic'

export default async function AdminJobsDisplayPage() {
    const jobs = await prisma.job.findMany({
        orderBy: { created_at: 'desc' },
        include: {
            employer: {
                include: { user: true }
            },
            category: true,
            region: true,
            images: true,
        },
        take: 5000
    })

    const serializedJobs = jobs.map(job => ({
        ...job,
        job_no: job.job_no,
        created_at: job.created_at.toISOString(),
        updated_at: job.updated_at.toISOString(),
        last_jumped_at: job.last_jumped_at.toISOString(),
        expired_at: job.expired_at?.toISOString() || null,
        next_auto_jump_at: job.next_auto_jump_at?.toISOString() || null,
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

    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">👑 채용공고 진열 관리</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">프리미엄 등급(VVIP/VIP) 및 자동 점프 설정을 일괄 관리합니다.</p>
                </div>
            </header>

            <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
                <DisplayTable initialJobs={serializedJobs} />
            </section>
        </div>
    )
}
