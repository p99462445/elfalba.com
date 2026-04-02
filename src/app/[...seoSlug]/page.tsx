import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { ArrowDownWideNarrow, ChevronLeft, MapPin, Search, X } from 'lucide-react'
import { buildJobSeoUrl, buildSeoUrl, CATEGORY_SLUG_TO_UI, REGION_SLUG_TO_SEO, CATEGORY_SLUG_TO_SEO } from '@/lib/seoUrls'
import JobCard from '@/components/jobs/JobCard'
import { parseSeoUrl } from '@/lib/seoUrls'
import { notFound } from 'next/navigation'
import FilterController from '@/components/jobs/FilterController'
import { MOCK_JOBS } from '@/lib/mockData'

export const dynamic = 'force-dynamic'
export const revalidate = 60

type Props = {
    params: Promise<{ seoSlug: string[] }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const decoded = decodeURIComponent(resolvedParams.seoSlug[0] || '');
        return {
            title: `${decoded} 채용정보 | 엘프알바`,
            description: `${decoded} 지역 및 직종별 실시간 모델, 방송, 촬영 구인구직 정보를 확인하세요.`,
        };
    } catch (e) {
        return { title: '채용정보 | 엘프알바' };
    }
}

export default async function CombinedSeoPage({ params }: Props) {
    const { seoSlug } = await params
    const rawPath = seoSlug[0] || ''
    const decodedPath = decodeURIComponent(rawPath).normalize('NFC')

    // Parse the SEO URL
    const { parent: parentSlug, sub: subSlug, category: categorySlug } = parseSeoUrl(rawPath)

    // Fallback or 404 if not a valid SEO URL pattern
    if (!parentSlug && !categorySlug && decodedPath !== '엘프알바' && decodedPath !== '') {
        return notFound()
    }

    // 1. All parent regions
    const mainRegions = await prisma.region.findMany({
        where: { parent_id: null },
        orderBy: { id: 'asc' }
    })

    const normSub = subSlug ? subSlug.normalize('NFC') : null;

    // 2. Resolve Active Sub and Parent
    let activeParent = parentSlug
        ? mainRegions.find(r => r.slug === parentSlug) || null
        : null

    let activeSub = null;

    if (normSub) {
        // Find sub-region by name fragment across ALL regions
        const foundSub = await prisma.region.findFirst({
            where: {
                parent_id: { not: null },
                name: { contains: normSub }
            },
            include: { parent: true }
        });

        if (foundSub) {
            // Check if it's a "good" match (first part matches)
            const firstName = foundSub.name.normalize('NFC').split('/')[0].trim();
            if (firstName.startsWith(normSub) || normSub.startsWith(firstName)) {
                activeSub = foundSub;
                if (!activeParent && foundSub.parent) {
                    activeParent = foundSub.parent;
                }
            }
        }
    }

    // 3. All regions for the client-side selector
    let allSubRegions = await prisma.region.findMany({
        where: { parent_id: { not: null } },
        orderBy: { id: 'asc' }
    })

    // Manual sorting for Seoul children
    const seoulParent = mainRegions.find(r => r.name === '서울')
    if (seoulParent) {
        const priority = ['강남/서초', '송파/강동', '관악/구로/금천/동작', '강서/양천/영등포']
        allSubRegions.sort((a, b) => {
            if (a.parent_id === seoulParent.id && b.parent_id === seoulParent.id) {
                const indexA = priority.indexOf(a.name)
                const indexB = priority.indexOf(b.name)
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
            }
            return 0
        })
    }

    // 4. Sub-regions of active parent (for display in UI)
    const subRegions = activeParent
        ? allSubRegions.filter(r => r.parent_id === activeParent.id)
        : []

    // 5. Categories from DB
    const categories = await prisma.jobCategory.findMany({
        where: { parent_id: null },
        orderBy: { id: 'asc' }
    })

    // 5. Active category
    const activeCategory = categorySlug
        ? categories.find(c => {
            if (c.slug === categorySlug) return true;
            // Handle special mapping cases
            if (categorySlug === 'aroma' && (c.name.includes('아로마') || c.name.includes('마사지'))) return true;
            if (categorySlug === 'etc' && c.name.includes('기타')) return true;

            const seoName = CATEGORY_SLUG_TO_SEO[categorySlug as keyof typeof CATEGORY_SLUG_TO_SEO] || '';
            const dbName = c.name.normalize('NFC');
            return seoName.includes(dbName) || dbName.includes(seoName.replace('알바', ''));
        }) || null
        : null

    // 7. Build where clause
    const where: any = { status: 'ACTIVE' }

    if (activeCategory) {
        where.category_id = activeCategory.id
    }

    if (activeSub) {
        where.region_id = activeSub.id
    } else if (activeParent) {
        where.OR = [
            { region_id: activeParent.id },
            { region: { parent_id: activeParent.id } }
        ]
    }

    // 8. Use Mock Jobs instead of Prisma
    const vvipJobs = MOCK_JOBS.slice(0, 3)
    const vipJobs = MOCK_JOBS.slice(3, 8)
    const listJobs = MOCK_JOBS.slice(8)

    const totalCount = listJobs.length

    // URL Builder (Direct SEO URLs)
    const buildUrl = (p: { parent?: string | null, sub?: string | null, category?: string | null }) => {
        let fParent = p.parent !== undefined ? p.parent : parentSlug;
        let fCategory = p.category !== undefined ? p.category : categorySlug;
        let fSub = p.sub !== undefined ? p.sub : (activeSub ? activeSub.name : subSlug);

        // If parent is being changed, reset sub unless a sub is also provided
        if (p.parent !== undefined && p.parent !== parentSlug) {
            fSub = p.sub !== undefined ? p.sub : null;
        }

        return buildSeoUrl(fParent, fSub, fCategory);
    }

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg pb-20 no-page-transition">
            {/* 
            <div className="w-full bg-white dark:bg-dark-card border-b border-gray-50 dark:border-dark-border sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" prefetch={true} className="text-gray-900 dark:text-gray-100 p-2 -ml-2 hover:text-gray-900 transition active:scale-95">
                            <ChevronLeft size={24} />
                        </Link>
                        <MapPin size={18} className="text-amber-500" />
                        <h1 className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">엘프알바 채용정보</h1>
                    </div>
                </div>
            </div>
            */}

            <div className="pt-2"></div>

            {/* NEW: Filter Controller (Modal-based) */}
            <FilterController 
                mainRegions={mainRegions}
                allSubRegions={allSubRegions}
                categories={categories}
                activeParent={activeParent}
                activeSub={activeSub}
                activeCategory={activeCategory}
                currentParentSlug={parentSlug}
                currentSubSlug={subSlug}
                currentCategorySlug={categorySlug}
            />

            {/* OLD: Filter Section (Commented out for backup) */}
            {/* 
            <section className="max-w-2xl mx-auto space-y-4 mb-5">
                <div className="px-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                    <Link href="/모델구인구직" prefetch={true} className={`font-bold transition-colors ${!activeParent ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>전국</Link>
                    {mainRegions.map(r => (
                        <Link
                            key={r.slug}
                            href={buildUrl({ parent: r.slug, sub: null })}
                            prefetch={true}
                            className={`font-bold transition-colors ${activeParent?.id === r.id ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            {r.name}
                        </Link>
                    ))}
                </div>

                {activeParent && subRegions.length > 0 && (
                    <div className="px-4 pt-3 border-t border-gray-50/50 dark:border-dark-border/50">
                        <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs">
                            <Link href={buildUrl({ sub: null })} prefetch={true} className={`font-bold transition-colors ${!activeSub ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'}`}>전체</Link>
                            {subRegions.map(s => (
                                <Link
                                    key={s.slug}
                                    href={buildUrl({ sub: s.name })}
                                    prefetch={true}
                                    className={`font-bold transition-all relative ${activeSub?.id === s.id ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                >
                                    {s.name}
                                    {activeSub?.id === s.id && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-500 rounded-full" />}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-4 pt-3 border-t border-gray-50/50 dark:border-dark-border/50 overflow-x-auto no-scrollbar">
                    <div className="flex justify-between items-center gap-1.5 min-w-max sm:min-w-0">
                        <Link
                            href={buildUrl({ category: null })}
                            prefetch={true}
                            className={`px-2 py-1 rounded-full text-[12px] font-black border transition-all whitespace-nowrap ${!activeCategory ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white dark:bg-dark-bg text-gray-400 dark:text-gray-500 border-gray-100 dark:border-dark-border hover:border-amber-300'}`}
                        >
                            &nbsp;전체&nbsp;
                        </Link>
                        {categories.map(c => {
                            const label = CATEGORY_SLUG_TO_UI[c.slug as keyof typeof CATEGORY_SLUG_TO_UI] || c.name.split('/')[0];
                            return (
                                <Link
                                    key={c.slug}
                                    href={buildUrl({ category: c.slug })}
                                    prefetch={true}
                                    className={`px-2 py-1 rounded-full text-[12px] font-black border transition-all whitespace-nowrap ${activeCategory?.id === c.id ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white dark:bg-dark-bg text-gray-400 dark:text-gray-500 border-gray-100 dark:border-dark-border hover:border-amber-300'}`}
                                >
                                    &nbsp;{label}&nbsp;
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </section>
            */}

            <main className="max-w-2xl mx-auto px-4 space-y-0">
                {vvipJobs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 pt-2 mb-2 px-2">
                            <span className="text-xs">👑</span>
                            <h3 className="text-[11px] font-black text-gray-400 tracking-tighter">프리미엄</h3>
                        </div>
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
                            {vvipJobs.map((job, idx) => (
                                <JobCard key={`vvip-${job.id}`} job={job} theme="premium" priority={idx === 0} />
                            ))}
                        </div>
                    </div>
                )}

                {vipJobs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 pt-2 mb-2 px-2">
                            <span className="text-xs text-amber-300">🌟</span>
                            <h3 className="text-[11px] font-black text-gray-400 tracking-tighter">추천</h3>
                        </div>
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
                            {vipJobs.map(job => (
                                <JobCard key={`vip-${job.id}`} job={job} theme="featured" />
                            ))}
                        </div>
                    </div>
                )}

                {listJobs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 pt-2 mb-2 px-2">
                            <span className="text-xs text-gray-300">📑</span>
                            <h3 className="text-[11px] font-black text-gray-400 tracking-tighter">일반</h3>
                        </div>
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
                            {listJobs.map(job => (
                                <JobCard key={`list-${job.id}`} job={job} theme="general" />
                            ))}
                        </div>
                    </div>
                )}

                {listJobs.length === 0 && vvipJobs.length === 0 && vipJobs.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-gray-300 font-bold">공고가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
