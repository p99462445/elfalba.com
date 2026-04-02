'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bookmark, Trash2, Loader2, MapPin, Building2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { buildJobSeoUrl } from '@/lib/seoUrls'
import { ko } from 'date-fns/locale'

export default function ApplicationsPage() {
    const router = useRouter()
    const [bookmarks, setBookmarks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchBookmarks()
    }, [])

    const fetchBookmarks = async () => {
        try {
            const res = await fetch('/api/bookmarks')
            const result = await res.json()
            if (result.data) {
                setBookmarks(result.data)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const removeBookmark = async (jobId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            const res = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            })
            const result = await res.json()
            if (result.isBookmarked === false) {
                setBookmarks(bookmarks.filter(b => b.job_id !== jobId))
            }
        } catch (error) {
            console.error('Remove error:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-dark-bg">
                <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/30 dark:bg-dark-bg flex flex-col font-sans">
            <header className="sticky top-0 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border h-[60px] flex items-center px-4 z-50">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-black text-[18px] text-gray-800 dark:text-gray-100 ml-2 tracking-tight">관심 목록</h1>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-24 md:pb-10">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-[20px] font-black text-gray-900 dark:text-gray-100 leading-tight">관심 공고</h2>
                        <p className="text-[14px] font-bold text-gray-400 dark:text-gray-500 mt-1">총 {bookmarks.length}건</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-amber-500">
                        <Bookmark size={24} strokeWidth={2.5} fill="currentColor" />
                    </div>
                </div>

                {bookmarks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-dark-card rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700 mb-6 border border-gray-50 dark:border-dark-border shadow-inner">
                            <Bookmark size={32} />
                        </div>
                        <p className="text-[16px] font-black text-gray-800 dark:text-gray-200 mb-2">관심 공고가 없습니다.</p>
                        <p className="text-[13px] font-bold text-gray-400 dark:text-gray-500 max-w-[200px]">마음에 드는 공고를 관심 등록하여<br />편리하게 모아보세요.</p>
                        <Link href="/" className="mt-8 px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-dark-bg font-black text-[14px] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg dark:shadow-none">
                            공고 보러가기
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookmarks.map((bookmark) => {
                            const job = bookmark.job
                            const imageUrl = job.images?.[0]?.image_url

                            return (
                                <Link
                                    href={buildJobSeoUrl(job)}
                                    key={bookmark.job_id}
                                    className="block bg-white dark:bg-dark-card rounded-[28px] p-4 shadow-sm border border-gray-100/50 dark:border-dark-border hover:shadow-md transition-all active:scale-[0.98] group relative"
                                >
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-bg relative border border-gray-50 dark:border-dark-border">
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={job.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-200 dark:text-gray-800">
                                                    <Building2 size={32} />
                                                </div>
                                            )}
                                            {job.status !== 'ACTIVE' && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <span className="text-white text-[11px] font-black px-2 py-1 bg-red-500 rounded-md">마감됨</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                            <div className="flex items-center gap-2 mb-1.5 mt-0.5">
                                                <span className="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-500/10">
                                                    {job.category?.name?.split('/')[0] || '업종'}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 flex items-center gap-0.5">
                                                    <MapPin size={10} /> {job.region?.name?.split(' ').pop() || '지역'}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-[16px] text-gray-900 dark:text-gray-100 mb-1 leading-snug truncate group-hover:text-amber-500 transition-colors tracking-tight">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mb-3 text-gray-400 dark:text-gray-500">
                                                <p className="text-[12px] font-bold truncate opacity-80">{job.employer?.business_name}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className="text-[15px] font-black text-gray-900 dark:text-white tracking-tight">
                                                    <span className="text-amber-500 mr-1">{job.salary_type === 'HOURLY' ? '시급' : job.salary_type === 'TC' ? 'TC' : '급여'}</span>
                                                    {job.salary_info || `${job.salary_amount?.toLocaleString()}원`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => removeBookmark(job.id, e)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-gray-50/50 dark:bg-dark-bg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all shadow-sm active:scale-90 flex items-center justify-center border border-gray-100 dark:border-dark-border"
                                        aria-label="Remove bookmark"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
