'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { buildJobSeoUrl } from '@/lib/seoUrls'
import { getOptimizedImageUrl } from '@/lib/image-utils'
import { useAuth } from '@/context/AuthContext'

interface JobCardProps {
    job: any
    theme?: 'premium' | 'featured' | 'general'
    priority?: boolean
}

export default function JobCard({ job, theme, priority }: JobCardProps) {
    const { requireAuth } = useAuth()
    const [isMounted, setIsMounted] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!job) return null

    const handleJobClick = (e: React.MouseEvent) => {
        e.preventDefault()
        requireAuth(() => {
            router.push(buildJobSeoUrl(job))
        })
    }

    // Calculate days active - Stable calculation
    const adDays = React.useMemo(() => {
        return Math.max(1, Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    }, [job.created_at])

    // Salary Type Mapping
    const salaryTypeObj: Record<string, string> = {
        'TC': 'TC',
        'HOURLY': '시급',
        'DAILY': '일급',
        'NEGOTIABLE': '협의'
    }
    const salaryType = salaryTypeObj[job.salary_type] || '급여'

    // Clean up salary info
    let salaryVal = job.salary_type === 'NEGOTIABLE' ? '' : (job.salary_info || `${job.salary_amount?.toLocaleString() || 0}원`)
    const prefixes = ['티씨', 'TC', 'T/C', '시급', '일급', '협의']
    prefixes.forEach(p => {
        if (salaryVal.startsWith(p)) salaryVal = salaryVal.replace(p, '').trim()
    })

    const safeRegion = job.region?.name || '지역미상'
    const shortRegion = safeRegion.split(' ').pop() || safeRegion
    const catName = job.category?.name?.split('/')[0] || '미분류'

    // Exposure Badge
    const effectiveTheme = theme || (
        job.exposure_level === 'VVIP' ? 'premium' :
            job.exposure_level === 'VIP' ? 'featured' : 'general'
    )

    return (
        <div
            onClick={handleJobClick}
            className="block border-b border-gray-100 dark:border-dark-border last:border-0 p-3 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors group cursor-pointer"
        >
            <div className={`flex gap-3 items-center ${effectiveTheme === 'general' ? 'px-1' : ''}`}>
                {/* Compact Logo: Show only for premium/featured */}
                {effectiveTheme !== 'general' && (
                    <div className="w-[64px] h-[64px] rounded-xl bg-gray-50 dark:bg-dark-bg flex-shrink-0 flex items-center justify-center border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden relative text-gray-200">
                        {job.logo_url ? (
                            <div className="w-full h-full relative">
                                <Image
                                    src={getOptimizedImageUrl(job.logo_url, 'thumbnail')}
                                    alt={job.title || ''}
                                    fill
                                    className="object-cover"
                                    priority={priority}
                                    sizes="64px"
                                    unoptimized={job.logo_url?.includes('/api/og/banner')}
                                />
                            </div>
                        ) : job.images && job.images.length > 0 ? (
                            <div className="w-full h-full relative">
                                {(() => {
                                    const imgAtIdx0 = job.images[0];
                                    const rawUrl = typeof imgAtIdx0 === 'string' ? imgAtIdx0 : imgAtIdx0?.image_url;
                                    const isBannerUrl = typeof rawUrl === 'string' && rawUrl.includes('/api/og/banner');
                                    
                                    return (
                                        <Image
                                            src={getOptimizedImageUrl(rawUrl, 'thumbnail')}
                                            alt={job.title || ''}
                                            fill
                                            className="object-cover"
                                            priority={priority}
                                            sizes="64px"
                                            unoptimized={isBannerUrl}
                                        />
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gray-100/50 dark:bg-dark-bg/50 text-gray-300 dark:text-gray-500 flex items-center justify-center text-[9px] font-black uppercase">
                                {job.employer?.business_name?.substring(0, 2) || '공고'}
                            </div>
                        )}
                    </div>
                )}

                {/* Content area */}
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
                    <div className="flex items-center gap-1 leading-none">
                        {effectiveTheme === 'premium' && <span className="text-[#f59e0b] text-[10px]">👑</span>}
                        {effectiveTheme === 'featured' && <span className="text-amber-300 text-[10px]">🌟</span>}
                        <span className="text-[13px] font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                            {job.title}
                        </span>
                        <span className="text-[9px] text-gray-300 font-bold ml-2" suppressHydrationWarning>
                            {isMounted ? `${adDays}일째` : ''}
                        </span>
                    </div>

                    <h3 className="font-bold text-[11px] text-gray-500 dark:text-gray-400 truncate leading-none">
                        {job.business_name || job.employer?.business_name || '상호미표기'}
                    </h3>

                    <div className="flex items-center gap-3 leading-none">
                        <div className="text-[9px] text-gray-300 font-bold flex gap-1 items-center">
                            <span>{salaryType}</span>
                            <span>{job.salary_type === 'NEGOTIABLE' ? '협의' : job.salary_amount ? `${Math.floor(job.salary_amount / 10000)}만원` : salaryVal}</span>
                            <span className="mx-0.5 opacity-50">·</span>
                            <span>{shortRegion}</span>
                            <span>·</span>
                            <span>{catName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
