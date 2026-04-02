'use client'
import React, { useState, useMemo } from 'react'
import { ArrowUpDown, HelpCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import UserInfoModal from '@/components/admin/UserInfoModal'
import BannerGeneratorModal from '@/components/admin/BannerGeneratorModal'
import { buildJobSeoUrl } from '@/lib/seoUrls'

interface Job {
    id: string
    job_no: number
    title: string
    status: string
    exposure_level: string
    expired_at: string | null
    logo_url: string | null
    images: string[]
    view_count: number
    remaining_auto_jumps: number
    auto_jump_interval_min: number
    is_auto_jump_enabled: boolean
    salary_type: string
    salary_amount: number
    created_at: string
    employer: {
        id: string
        business_name: string
        owner_name: string | null
        phone: string | null
        user: {
            id: string
            email: string
            name: string | null
            phone: string | null
        } | null
    } | null
    category: {
        name: string
    } | null
    region?: {
        name: string
    } | null
}

export default function DisplayTable({ initialJobs }: { initialJobs: any[] }) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs)
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState<string | null>(null)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [editingJumpId, setEditingJumpId] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<{ key: 'grade' | 'job_no' | 'expired_at', direction: 'asc' | 'desc' } | null>({ key: 'grade', direction: 'desc' })
    const [generatingBannerJob, setGeneratingBannerJob] = useState<{ id: string, title: string } | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20
    const [colWidths, setColWidths] = useState<number[]>([70, 80, 80, 150, 180, 80, 100, 130, 80, 80, 120])

    const handleMouseDown = (index: number, e: React.MouseEvent) => {
        e.preventDefault()
        const startX = e.clientX
        const startWidth = colWidths[index]
        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX))
            setColWidths(prev => {
                const next = [...prev]
                next[index] = newWidth
                return next
            })
        }
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    const filteredJobs = useMemo(() => {
        const searchVal = searchTerm.toLowerCase()
        return jobs.filter(job => {
            if (!searchTerm) return true;
            return (
                job.title.toLowerCase().includes(searchVal) ||
                job.employer?.business_name.toLowerCase().includes(searchVal) ||
                job.employer?.user?.email.toLowerCase().includes(searchVal) ||
                `#${job.job_no}`.includes(searchTerm)
            )
        })
    }, [jobs, searchTerm])

    const sortedJobs = useMemo(() => {
        let result = [...filteredJobs]
        if (sortConfig) {
            result.sort((a, b) => {
                if (sortConfig.key === 'grade') {
                    const getRank = (lvl: string) => lvl === 'VVIP' ? 3 : lvl === 'VIP' ? 2 : 1
                    const ra = getRank(a.exposure_level)
                    const rb = getRank(b.exposure_level)
                    return sortConfig.direction === 'desc' ? rb - ra : ra - rb
                }
                if (sortConfig.key === 'job_no') {
                    return sortConfig.direction === 'desc' ? b.job_no - a.job_no : a.job_no - b.job_no
                }
                if (sortConfig.key === 'expired_at') {
                    const timeA = a.expired_at ? new Date(a.expired_at).getTime() : 0
                    const timeB = b.expired_at ? new Date(b.expired_at).getTime() : 0
                    return sortConfig.direction === 'desc' ? timeB - timeA : timeA - timeB
                }
                return 0
            })
        }
        return result
    }, [filteredJobs, sortConfig])

    const totalPages = Math.ceil(sortedJobs.length / itemsPerPage)
    const paginatedJobs = sortedJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleJumpEdit = async (id: string, updates: { jumpCount?: number, intervalMin?: number, isEnabled?: boolean, exposureLevel?: string }) => {
        setLoading(`jump-${id}`)
        try {
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type: 'JOB_JUMP_EDIT',
                    ...updates
                })
            })
            if (!res.ok) throw new Error('업데이트 실패')

            setJobs(prev => prev.map(job =>
                job.id === id ? {
                    ...job,
                    remaining_auto_jumps: updates.jumpCount !== undefined ? updates.jumpCount : job.remaining_auto_jumps,
                    auto_jump_interval_min: updates.intervalMin !== undefined ? updates.intervalMin : job.auto_jump_interval_min,
                    is_auto_jump_enabled: updates.isEnabled !== undefined ? updates.isEnabled : job.is_auto_jump_enabled,
                    exposure_level: updates.exposureLevel !== undefined ? (updates.exposureLevel as any) : job.exposure_level
                } : job
            ))
            setEditingJumpId(null)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(null)
        }
    }

    const calculateDaysLeft = (expiredAt: string | null) => {
        if (!expiredAt) return null
        const diff = new Date(expiredAt).getTime() - new Date().getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days
    }

    return (
        <div className="flex flex-col">
            <div className="p-4 bg-indigo-50/30 dark:bg-dark-bg border-b border-indigo-100 dark:border-dark-border flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="공고번호, 상호명, 제목 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-dark-card border border-indigo-100 dark:border-dark-border rounded-xl text-sm font-bold focus:border-indigo-300 outline-none transition-all shadow-sm text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total:</span>
                        <span className="text-xs font-black text-indigo-600">{filteredJobs.length}건</span>
                    </div>
                </div>
                <div className="ml-auto text-xs font-bold text-indigo-400 bg-white px-3 py-1.5 rounded-lg border border-indigo-50 flex items-center gap-1.5">
                    <HelpCircle size={14} />
                    메인 상단 노출 및 자동 점프를 관리하는 탭입니다.
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                    <thead>
                        <tr className="border-b dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-700 dark:text-gray-300">
                            {['사진', '배너생성', '번호', '상호명', '공고제목', '등급', '남은기간', '점프설정', '노출설정', '조회', '액션'].map((header, index) => {
                                const isSortable = ['번호', '등급', '남은기간'].includes(header)
                                const sortKeyMatch = header === '번호' ? 'job_no' : header === '등급' ? 'grade' : 'expired_at'
                                const isActiveSort = sortConfig?.key === sortKeyMatch

                                return (
                                    <th key={`${header}-${index}`} style={{ width: colWidths[index] }} className="p-4 font-bold text-[12px] relative truncate border-r border-gray-100 dark:border-dark-border last:border-0">
                                        <div
                                            className={`flex items-center justify-between ${isSortable ? 'cursor-pointer hover:text-indigo-500 transition-colors' : ''}`}
                                            onClick={() => {
                                                if (isSortable) {
                                                    setSortConfig(prev => {
                                                        if (prev?.key === sortKeyMatch) {
                                                            return prev.direction === 'desc' ? { key: sortKeyMatch, direction: 'asc' } : null
                                                        }
                                                        return { key: sortKeyMatch, direction: 'desc' }
                                                    })
                                                }
                                            }}
                                        >
                                            <span className={`flex items-center gap-1.5 ${isActiveSort ? 'text-indigo-500' : ''}`}>
                                                {header}
                                                {isSortable && (
                                                    <ArrowUpDown size={12} className={`${isActiveSort ? 'text-indigo-500' : 'text-gray-300 opacity-50'} transition-opacity`} />
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            onMouseDown={(e) => handleMouseDown(index, e)}
                                            className="absolute right-0 top-0 w-2.5 h-full cursor-col-resize hover:bg-indigo-300 z-10 select-none group"
                                        >
                                            <div className="w-[1px] h-full bg-gray-200 dark:bg-dark-border mx-auto group-hover:bg-indigo-400"></div>
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedJobs.map(job => (
                            <tr key={job.id} className="border-b dark:border-dark-border hover:bg-indigo-50/10 dark:hover:bg-indigo-900/10 transition-colors text-[13px]">
                                <td className="p-4 align-top text-center">
                                    <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-dark-bg rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 dark:border-dark-border shadow-sm">
                                        {job.logo_url ? (
                                            <img src={job.logo_url} className="w-full h-full object-cover" alt="로고" />
                                        ) : job.images && job.images.length > 0 ? (
                                            <img src={job.images[0]} className="w-full h-full object-cover" alt="이미지" />
                                        ) : (
                                            <span className="text-[9px] text-gray-400 font-bold uppercase">No Img</span>
                                        )}
                                    </div>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <button
                                        disabled
                                        className="px-2 py-1.5 flex items-center justify-center gap-1 bg-gray-200 text-gray-400 text-[10px] font-black rounded-lg min-w-[60px] cursor-not-allowed"
                                        title="배너 생성기 점검 중"
                                    >
                                        🚧 준비중
                                    </button>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <span className="font-black text-gray-400">#{job.job_no}</span>
                                </td>

                                <td className="p-4 align-top truncate font-black text-gray-700 dark:text-gray-300" title={job.employer?.business_name || '-'}>
                                    {job.employer?.business_name || '-'}
                                </td>

                                <td className="p-4 align-top">
                                    <Link href={buildJobSeoUrl(job as any)} target="_blank" className="font-black text-gray-900 dark:text-white hover:text-indigo-500 hover:underline line-clamp-1 leading-tight">
                                        {job.title}
                                    </Link>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${job.exposure_level === 'VVIP' ? 'bg-amber-100 text-amber-600' : job.exposure_level === 'VIP' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {job.exposure_level}
                                    </span>
                                </td>

                                <td className="p-4 align-top text-center">
                                    {isMounted && job.expired_at ? (
                                        <div className="flex flex-col gap-0.5 text-center">
                                            <span className="text-[11px] font-bold text-gray-400">~{new Date(job.expired_at).toISOString().split('T')[0]}</span>
                                            <span className={`text-[10px] font-black ${calculateDaysLeft(job.expired_at)! > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                ({calculateDaysLeft(job.expired_at)! > 0 ? `${calculateDaysLeft(job.expired_at)}일 남음` : '만료됨'})
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-gray-300">-</span>
                                    )}
                                </td>

                                <td className="p-4 align-top text-center">
                                    <div className="relative group cursor-pointer inline-flex" onClick={() => setEditingJumpId(job.id === editingJumpId ? null : job.id)}>
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1.5 ${job.is_auto_jump_enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                            🚀 {job.remaining_auto_jumps}회 / {job.auto_jump_interval_min}분
                                        </span>
                                        {editingJumpId === job.id && (
                                            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-dark-card shadow-2xl border border-gray-100 dark:border-dark-border p-4 rounded-xl w-48 space-y-3 z-50 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                                <div className="text-left">
                                                    <label className="text-[9px] font-black text-gray-400 mb-1 block uppercase">남은 횟수</label>
                                                    <input id={`jump-count-${job.id}`} type="number" className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-sm font-bold" defaultValue={job.remaining_auto_jumps} />
                                                </div>
                                                <div className="text-left">
                                                    <label className="text-[9px] font-black text-gray-400 mb-1 block uppercase">간격 (분)</label>
                                                    <input id={`jump-interval-${job.id}`} type="number" className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-sm font-bold" defaultValue={job.auto_jump_interval_min} />
                                                </div>
                                                <button onClick={() => {
                                                    const jumpCount = parseInt((document.getElementById(`jump-count-${job.id}`) as HTMLInputElement).value)
                                                    const intervalMin = parseInt((document.getElementById(`jump-interval-${job.id}`) as HTMLInputElement).value)
                                                    handleJumpEdit(job.id, { jumpCount, intervalMin })
                                                }} className="w-full py-2 bg-gray-900 text-white rounded-lg text-[11px] font-black hover:bg-indigo-500 transition">설정 저장</button>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <select
                                        value={job.exposure_level}
                                        onChange={(e) => handleJumpEdit(job.id, { exposureLevel: e.target.value })}
                                        className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded px-1.5 py-1 text-[11px] font-black outline-none"
                                    >
                                        <option value="GENERAL">NORMAL</option>
                                        <option value="VIP">VIP</option>
                                        <option value="VVIP">VVIP</option>
                                    </select>
                                </td>

                                <td className="p-4 align-top text-center font-bold text-gray-400 text-[11px]">
                                    {job.view_count.toLocaleString()}
                                </td>

                                <td className="p-4 align-top text-center">
                                    <Link href={`/admin/jobs/${job.id}/edit`} className="inline-block bg-gray-900 text-white px-2 py-1.5 rounded-lg text-[10px] font-black hover:bg-indigo-600 transition">관리</Link>
                                </td>
                            </tr>
                        ))}
                        {paginatedJobs.length === 0 && (
                            <tr>
                                <td colSpan={11} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">No Jobs Found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-6 flex items-center justify-center gap-2 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                    >
                        이전
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-black transition-all flex items-center justify-center ${currentPage === page ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                    >
                        다음
                    </button>
                </div>
            )}

            {selectedUserId && (
                <UserInfoModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}

            {/* Banner Generator temporarily disabled to reduce Vercel API usage */}
            {false && generatingBannerJob && (
                <BannerGeneratorModal
                    jobId={generatingBannerJob.id}
                    initialTitle={generatingBannerJob.title}
                    onClose={() => setGeneratingBannerJob(null)}
                    onSuccess={(url) => {
                        setJobs(prev => prev.map(j => j.id === generatingBannerJob!.id ? { ...j, logo_url: url } : j))
                        setGeneratingBannerJob(null)
                    }}
                />
            )}
        </div>
    )
}
