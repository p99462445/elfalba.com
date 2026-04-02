'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { searchJobByNo, setOfficialPartner, removeOfficialPartner } from './actions'
import JobCard from '@/components/jobs/JobCard'
import { Trash2, Search, Plus, Loader2, Edit3, Calendar, Clock, Crown } from 'lucide-react'
import Link from 'next/link'
import { buildJobSeoUrl } from '@/lib/seoUrls'

export default function PartnersClient({ initialPartners }: { initialPartners: any[] }) {
    const router = useRouter()
    const [searchNo, setSearchNo] = useState('')
    const [searchedJob, setSearchedJob] = useState<any>(null)
    const [days, setDays] = useState(30)
    const [isLoading, setIsLoading] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSearch = async () => {
        if (!searchNo) return
        setIsLoading(true)
        const res = await searchJobByNo(Number(searchNo))
        setIsLoading(false)
        if (res.success && res.job) {
            const job = res.job
            setSearchedJob(job)
            // Calculate automated duration based on furthest expiration date
            const expDates = [job.vvip_expired_at, job.vip_expired_at, job.normal_expired_at].filter(Boolean)
            if (expDates.length > 0) {
                const furthest = new Date(expDates.reduce((a, b) => new Date(a!) > new Date(b!) ? a : b)!)
                const diffDays = Math.ceil((furthest.getTime() - new Date().getTime()) / 86400000)
                setDays(Math.max(1, diffDays))
            } else {
                setDays(30) // Default if no expiration set
            }
        } else {
            alert(res.error)
            setSearchedJob(null)
        }
    }

    const handleAdd = async () => {
        if (!searchedJob) return
        if (!confirm(`[${searchedJob.business_name || '미등록'}] 공고를 공식 파트너로 ${days}일간 등록하시겠습니까?`)) return
        
        setIsLoading(true)
        const res = await setOfficialPartner(searchedJob.id, days)
        setIsLoading(false)
        
        if (res.success) {
            alert('등록되었습니다.')
            setSearchNo('')
            setSearchedJob(null)
            startTransition(() => {
                router.refresh()
            })
        } else {
            alert(res.error || '에러가 발생했습니다.')
        }
    }

    const handleRemove = async (jobId: string, title: string) => {
        if (!confirm(`'${title}'의 공식 파트너 지정을 취소하시겠습니까?`)) return
        
        setIsLoading(true)
        const res = await removeOfficialPartner(jobId)
        setIsLoading(false)
        
        if (res.success) {
            alert('해제되었습니다.')
            startTransition(() => {
                router.refresh()
            })
        } else {
            alert(res.error || '에러가 발생했습니다.')
        }
    }

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6 md:p-8">
                <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <Plus className="text-amber-500" />
                    새 파트너 불러오기
                </h2>
                
                <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                    <div className="w-full md:w-1/3">
                        <label className="block text-xs font-bold text-gray-500 mb-2">공고 번호(Job No) 검색</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={searchNo} 
                                onChange={(e) => setSearchNo(e.target.value)}
                                placeholder="예: 1234"
                                className="w-full pl-10 pr-4 h-11 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl text-sm font-bold outline-none focus:border-amber-300 transition-all text-gray-900 dark:text-gray-100"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                    <button 
                        onClick={handleSearch} 
                        disabled={isLoading || !searchNo}
                        className="h-11 px-6 w-full md:w-auto bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                    >
                        {isLoading && !searchedJob ? <Loader2 size={16} className="animate-spin" /> : '찾기'}
                    </button>
                    
                    {searchedJob && (
                        <>
                            <div className="w-full md:w-1/4 pt-4 md:pt-0">
                                <label className="block text-xs font-bold text-gray-500 mb-2">노출 종료일 설정</label>
                                <input 
                                    type="date" 
                                    defaultValue={(() => {
                                        const expDates = [searchedJob.vvip_expired_at, searchedJob.vip_expired_at, searchedJob.normal_expired_at].filter(Boolean)
                                        if (expDates.length > 0) {
                                            const furthest = new Date(expDates.reduce((a, b) => new Date(a!) > new Date(b!) ? a : b)!)
                                            return furthest.toISOString().split('T')[0]
                                        }
                                        const defaultExp = new Date();
                                        defaultExp.setDate(defaultExp.getDate() + 30);
                                        return defaultExp.toISOString().split('T')[0];
                                    })()}
                                    id="add-partner-date"
                                    className="w-full px-4 h-11 bg-white dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl text-sm font-bold outline-none focus:border-amber-300 transition-all text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <button 
                                onClick={async () => {
                                    const dateEl = document.getElementById('add-partner-date') as HTMLInputElement;
                                    const selectedDate = dateEl?.value;
                                    if (!selectedDate) return alert('날짜를 선택해주세요.');
                                    
                                    if (!confirm(`[${searchedJob.business_name || '미등록'}] 공고를 공식 파트너로 ${selectedDate}까지 등록하시겠습니까?`)) return
                                    
                                    setIsLoading(true)
                                    const res = await setOfficialPartner(searchedJob.id, 0, selectedDate)
                                    setIsLoading(false)
                                    
                                    if (res.success) {
                                        alert('등록되었습니다.')
                                        setSearchNo('')
                                        setSearchedJob(null)
                                        startTransition(() => router.refresh())
                                    } else {
                                        alert(res.error || '에러가 발생했습니다.')
                                    }
                                }}
                                disabled={isLoading}
                                className="h-11 px-8 bg-gradient-to-r from-amber-500 to-purple-500 text-white rounded-xl font-black text-sm active:scale-95 transition-all w-full md:w-auto shrink-0 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : '파트너로 등록'}
                            </button>
                        </>
                    )}
                </div>

                {searchedJob && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-pink-950/20 text-amber-600 dark:text-amber-400 rounded-xl font-bold flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border border-amber-100 dark:border-pink-900/30">
                        <div className="text-sm">
                            <span className="bg-amber-100 dark:bg-pink-900/50 text-pink-700 dark:text-amber-300 px-2 py-0.5 rounded mr-2 text-xs">NO. {searchedJob.job_no}</span>
                            상호: <span className="text-gray-900 dark:text-white mr-3">{searchedJob.business_name || '미등록'}</span> 
                            제목: <Link href={buildJobSeoUrl(searchedJob)} className="hover:underline text-gray-900 dark:text-white line-clamp-1 md:inline">{searchedJob.title}</Link>
                        </div>
                        <span className="text-xs bg-white dark:bg-dark-bg px-2 py-1 rounded text-gray-500 shrink-0">
                            상태: {searchedJob.status}
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6 md:p-8">
                <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center justify-between border-b pb-4 dark:border-dark-border">
                    <div className="flex items-center gap-2">
                        <span>진행 중인 파트너</span> 
                        <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md text-sm">{initialPartners.length}건</span>
                    </div>
                    <span className="text-xs font-normal text-gray-400">만료일이 가까운 순서 정렬</span>
                </h2>

                {initialPartners.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-dark-border rounded-2xl mx-auto flex flex-col items-center">
                        <span className="text-4xl mb-4 grayscale opacity-30">👑</span>
                        등록된 공식 파트너가 없습니다.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {initialPartners.map(partner => (
                            <div key={partner.id} className="flex flex-col xl:flex-row gap-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                {/* Job Card Area */}
                                <div className="flex-1 min-w-0">
                                    <Link 
                                        href={buildJobSeoUrl(partner)}
                                        className="block transition-opacity opacity-90 hover:opacity-100"
                                    >
                                        <JobCard job={partner} theme="premium" />
                                    </Link>
                                    <div className="px-5 py-3 bg-gray-50/50 dark:bg-dark-bg/30 border-t border-gray-50 dark:border-dark-border flex flex-wrap gap-4 text-[11px] font-bold text-gray-500">
                                        <span className="flex items-center gap-1.5"><Crown size={12} className="text-amber-500" /> 파트너 만료: {new Date(partner.official_partner_expires_at).toLocaleString()}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-purple-400" /> VVIP: {partner.vvip_expired_at ? new Date(partner.vvip_expired_at).toLocaleDateString() : '없음'}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-400" /> VIP: {partner.vip_expired_at ? new Date(partner.vip_expired_at).toLocaleDateString() : '없음'}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-400" /> 일반: {partner.normal_expired_at ? new Date(partner.normal_expired_at).toLocaleDateString() : '없음'}</span>
                                    </div>
                                </div>

                                {/* Multi-Action Panel */}
                                <div className="w-full xl:w-72 p-5 bg-gray-50 dark:bg-dark-bg/50 border-t xl:border-t-0 xl:border-l border-gray-100 dark:border-dark-border flex flex-col justify-center gap-3">
                                    <div className="space-y-1.5 mb-1">
                                        <label className="text-[10px] uppercase tracking-wider font-black text-gray-400 pl-1">기간 수정하기</label>
                                        <div className="flex gap-1.5">
                                            <input 
                                                type="date" 
                                                defaultValue={new Date(partner.official_partner_expires_at).toISOString().split('T')[0]}
                                                onChange={async (e) => {
                                                    const newDate = e.target.value;
                                                    if (!newDate) return;
                                                    setIsLoading(true);
                                                    const res = await setOfficialPartner(partner.id, 0, newDate);
                                                    setIsLoading(false);
                                                    if (res.success) {
                                                        startTransition(() => router.refresh());
                                                    } else {
                                                        alert(res.error);
                                                    }
                                                }}
                                                className="flex-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-300 transition-all text-gray-900 dark:text-gray-100"
                                            />
                                            <div className="bg-amber-100 dark:bg-pink-900/30 text-amber-600 p-2 rounded-xl">
                                                <Calendar size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link 
                                            href={`/admin/jobs/${partner.id}/edit`}
                                            className="flex-1 h-10 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-border rounded-xl flex items-center justify-center gap-2 font-black text-xs hover:bg-gray-50 transition active:scale-95"
                                        >
                                            <Edit3 size={14} /> 수정
                                        </Link>
                                        <button 
                                            onClick={() => handleRemove(partner.id, partner.title)}
                                            disabled={isLoading}
                                            className="flex-1 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center justify-center gap-2 font-black text-xs hover:bg-rose-100 transition active:scale-95"
                                        >
                                            <Trash2 size={14} /> 해제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
