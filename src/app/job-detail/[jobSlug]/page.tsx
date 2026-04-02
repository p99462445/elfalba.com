import React from 'react'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { buildJobSeoUrl } from '@/lib/seoUrls'
import type { Metadata } from 'next'
import JobDetailClient from '@/components/jobs/JobDetailClient'

export const dynamic = 'force-dynamic'

// SEO Metadata for the new /구인/[jobSlug] route
type Props = {
    params: Promise<{ jobSlug: string }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const decodedSlug = decodeURIComponent(resolvedParams.jobSlug);
        let id = '';
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = decodedSlug.match(uuidRegex);
        if (match) id = match[0];

        if (!id) return { title: '채용정보 | 엘프알바' };

        const job = await prisma.job.findUnique({
            where: { id },
            include: { employer: true, region: true, category: true }
        });

        if (!job) return { title: '채용정보 | 엘프알바' };

        const title = `${job.title} | 엘프알바`;
        const description = job.description.slice(0, 120);

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'article',
                locale: 'ko_KR',
            }
        };
    } catch (e) {
        return { title: '채용정보 | 엘프알바' };
    }
}

export default async function NewJobDetailPage({ params }: { params: Promise<{ jobSlug: string }> }) {
    const { jobSlug } = await params

    // Extract ID from the end of the slug
    // Example: 강남-텐프로-아테나-12345678-abcd-1234 -> we split by '-' 
    // Since UUID also has '-', we need to handle it properly.
    // However, our UUIDs have multiple '-'.
    // A better approach is to find the last occurrence of the UUID pattern, OR just assume the ID is the standard Prisma UUID.
    // Actually, UUID is 36 chars long and has 4 dashes.
    // Let's use Regex to extract the UUID from the end of the string.
    const decodedSlug = decodeURIComponent(jobSlug)
    let id = ''

    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = decodedSlug.match(uuidRegex);

    if (match) {
        id = match[0]
    }

    if (!id) notFound()

    const job = await prisma.job.findUnique({
        where: { id },
        include: {
            employer: true,
            region: true,
            category: true,
            images: true
        }
    })
    if (!job) notFound()

    // 3. 주소 자동 교정 (Redirect to correct SEO URL)
    // 현재 주소와 시스템이 생성한 정답 주소가 다르면 정답 주소로 이동시킵니다.
    const correctUrl = buildJobSeoUrl(job)
    const currentUrlPart = `/구인/${jobSlug}`
    
    if (decodeURIComponent(currentUrlPart) !== decodeURIComponent(correctUrl)) {
        redirect(correctUrl)
    }

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg">
            <JobDetailClient job={job} />
        </div>
    )
}

