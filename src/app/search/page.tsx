'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, X, MapPin, Tag, Sparkles } from 'lucide-react'
import { buildJobSeoUrl } from '@/lib/seoUrls'

export default function SearchPage() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!query.trim()) return

        // Mocking/Fetching search results
        const res = await fetch(`/api/jobs?search=${query}`)
        const data = await res.json()
        setResults(data.jobs || [])
    }

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg">
            <header className="bg-white dark:bg-dark-card border-b border-gray-50 dark:border-dark-border h-14 flex items-center px-4 gap-2 sticky top-0 z-50">
                <button onClick={() => router.back()} className="text-gray-900 dark:text-gray-100 p-2 -ml-2 mr-0.5 hover:text-gray-900 dark:hover:text-white transition active:scale-95">
                    <ChevronLeft size={24} />
                </button>
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="제목, 지역, 업종 검색..."
                        className="w-full h-10 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl pl-10 pr-4 text-[13px] font-bold outline-none focus:border-amber-300 focus:bg-white dark:focus:bg-dark-card transition text-gray-900 dark:text-gray-100"
                        autoFocus
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition">
                            <X size={14} />
                        </button>
                    )}
                </form>
                {query && (
                    <button onClick={() => handleSearch()} className="text-[13px] font-black text-amber-500 px-2 active:scale-95">검색</button>
                )}
            </header>

            <main className="max-w-xl mx-auto p-6">
                {!query ? (
                    <div className="space-y-10">
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                                <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">인기 키워드</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['강남', '서초', '바/카페', 'T/C 6만원', '숙식제공', '당일지급'].map(tag => (
                                    <button key={tag} onClick={() => setQuery(tag)} className="px-5 py-2.5 bg-gray-50 dark:bg-dark-card text-gray-600 dark:text-gray-400 rounded-2xl border border-gray-100 dark:border-dark-border text-[13px] font-bold hover:bg-amber-50 dark:hover:bg-pink-900/20 hover:text-amber-500 hover:border-amber-200 transition">
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="bg-amber-50 dark:bg-pink-950/20 rounded-[35px] p-8 text-center border border-amber-100 dark:border-pink-900/30 shadow-soft">
                            <Sparkles className="text-amber-400 mx-auto mb-4" />
                            <h3 className="font-black text-lg text-amber-600 mb-1">나의 관심 지역 찾기</h3>
                            <p className="text-[11px] text-amber-400 font-bold mb-6">원하는 지역만 쏙쏙 검색해 보세요!</p>
                            <Link href="/밤알바" className="inline-flex h-12 px-8 bg-white dark:bg-dark-card text-amber-500 rounded-2xl items-center justify-center font-black text-sm shadow-sm hover:shadow-md transition">지역 전체보기</Link>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 mb-6">'<span className="text-amber-500">{query}</span>' 검색 결과 {results.length}건</p>
                        {results.length > 0 ? (
                            results.map(job => (
                                <Link key={job.id} href={buildJobSeoUrl(job)} className="block transition active:scale-[0.98]">
                                    <JobListItem job={job} />
                                </Link>
                            ))
                        ) : (
                            <div className="py-24 text-center">
                                <div className="text-4xl mb-4 grayscale opacity-20">🔎</div>
                                <p className="text-gray-300 dark:text-gray-600 font-bold">검색 결과가 없습니다.<br /><span className="text-[11px] font-normal">다른 키워드로 다시 검색해 보세요.</span></p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

function JobListItem({ job }: { job: any }) {
    return (
        <div className="bg-white dark:bg-dark-card border rounded-[30px] p-5 flex gap-4 shadow-sm border-gray-100/80 dark:border-dark-border group">
            <div className="w-[60px] h-[60px] bg-gray-50 dark:bg-dark-bg rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-gray-200 dark:text-gray-700 text-[10px] border border-gray-100 dark:border-dark-border uppercase">Logo</div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                    <h3 className="font-black text-[15px] truncate group-hover:text-amber-500 transition line-clamp-1 text-gray-900 dark:text-gray-100">{job.employer.business_name}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 truncate">{job.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400 font-bold">
                    <MapPin size={12} className="text-amber-300" />
                    {job.region.name} <span>|</span> {job.category.name}
                </div>
            </div>
        </div>
    )
}
