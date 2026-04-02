'use client'
import React, { useState, useMemo } from 'react'
import { ArrowUpDown, Search, Loader2, Image as ImageIcon, ExternalLink, MoreVertical, Copy, Trash2, Check, X, Star, Clock } from 'lucide-react'
import Link from 'next/link'
import UserInfoModal from '@/components/admin/UserInfoModal'
import BannerGeneratorModal from '@/components/admin/BannerGeneratorModal'
import { buildJobSeoUrl } from '@/lib/seoUrls'
import { setOfficialPartner } from '../official-partners/actions'

interface Job {
    id: string
    job_no: number
    title: string
    status: string
    exposure_level: string
    expired_at: string | null
    vvip_expired_at?: string | null
    vip_expired_at?: string | null
    normal_expired_at?: string | null
    is_official_partner?: boolean
    official_partner_expires_at?: string | null
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

interface JobsTableProps {
    initialJobs: any[]
    mode?: 'default' | 'exposure'
}

export default function JobsTable({ initialJobs, mode = 'default' }: JobsTableProps) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs)
    const [total, setTotal] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchFilter, setSearchFilter] = useState('ALL')
    const [loading, setLoading] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [editingJumpId, setEditingJumpId] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<{ key: 'grade' | 'job_no' | 'expired_at', direction: 'asc' | 'desc' } | null>(null)
    const [generatingBannerJob, setGeneratingBannerJob] = useState<{ id: string, title: string } | null>(null)
    const [hoveredJob, setHoveredJob] = useState<{ job: any, x: number, y: number } | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    // 페이지네이션 및 열 너비 상태
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const url = new URL('/api/admin/jobs', window.location.origin);
            url.searchParams.set('page', String(currentPage));
            url.searchParams.set('limit', String(itemsPerPage));
            url.searchParams.set('showOnlyActive', mode === 'exposure' ? 'true' : 'false');
            
            if (searchTerm) {
                url.searchParams.set('search', searchTerm);
                url.searchParams.set('filter', searchFilter);
            }
            
            if (sortConfig) {
                url.searchParams.set('sort', sortConfig.key);
                url.searchParams.set('direction', sortConfig.direction);
            } else if (mode === 'exposure') {
                url.searchParams.set('sort', 'expired_at');
                url.searchParams.set('direction', 'asc');
            }

            const res = await fetch(url.toString());
            const data = await res.json();
            if (res.ok) {
                setJobs(data.jobs);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Fetch Jobs Error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    React.useEffect(() => {
        setIsMounted(true)
        fetchJobs()
    }, [currentPage, itemsPerPage, sortConfig])
    const colWidths = [70, 80, 80, 100, 100, 70, 100, 150, 180, 70, 100, 130, 80, 70, 100]

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setCurrentPage(1)
        fetchJobs()
    }

    const totalPages = Math.ceil(total / itemsPerPage)

    const paginatedJobs = jobs

    const pageGroupSize = 10;
    const currentGroup = Math.ceil(currentPage / pageGroupSize);
    const startPage = Math.max(1, (currentGroup - 1) * pageGroupSize + 1);
    const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
    const pagesInGroup = Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i);

    const handleAction = async (id: string, status: string) => {
        const actionLabel = status === 'ACTIVE' ? '승인' : status === 'REJECTED' ? '블라인드 처리' : '삭제'

        const confirmMsg = status === 'DELETE'
            ? "⚠️ 이 공고를 영구히 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다."
            : `공고를 ${actionLabel} 하시겠습니까?`

        if (!confirm(confirmMsg)) return

        setLoading(id)
        try {
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type: (status === 'DELETE' ? 'JOB_DELETE' : 'JOB_STATUS'),
                    status
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            if (status === 'DELETE') {
                setJobs(prev => prev.filter(job => job.id !== id))
            } else {
                setJobs(prev => prev.map(job =>
                    job.id === id ? { ...job, status: status } : job
                ))
            }
            alert('처리되었습니다.')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(null)
        }
    }

    const handleJumpEdit = async (id: string, updates: { jumpCount?: number, intervalMin?: number, isEnabled?: boolean }) => {
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
                    is_auto_jump_enabled: updates.isEnabled !== undefined ? updates.isEnabled : job.is_auto_jump_enabled
                } : job
            ))
            setEditingJumpId(null)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(null)
        }
    }

    const handleClone = async (id: string, includeDates: boolean = false) => {
        const msg = includeDates 
            ? '⚠️ [관리자 특별 권한] 예약된 VVIP/VIP/일반 유료 기간을 모두 통째로 복사하시겠습니까?'
            : '알맹이(사진/글)만 복사하시겠습니까? (유료 기간은 모두 0일로 빈 껍데기만 복사됩니다)'
        if (!confirm(msg)) return
        
        setLoading(`clone-${id}`)
        try {
            const res = await fetch(`/api/admin/jobs/${id}/clone`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ includeDates })
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || '복사 실패')
            }
            alert('복사되었습니다. 새로고침 시 나타납니다.')
            window.location.reload()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(null)
        }
    }

    const handleOfficialPartnerToggle = async (job: Job) => {
        if (!confirm(`'${job.employer?.business_name || job.title}' 공고를 공식 파트너로 등록하시겠습니까?\n(가장 늦게 끝나는 마감일에 맞춰 자동 설정됩니다)`)) return
        
        setLoading(job.id)
        try {
            const expDates = [job.vvip_expired_at, job.vip_expired_at, job.normal_expired_at].filter(Boolean)
            let selectedDate: string | undefined;
            
            if (expDates.length > 0) {
                const furthest = new Date(expDates.reduce((a, b) => new Date(a!) > new Date(b!) ? a : b)!)
                selectedDate = furthest.toISOString().split('T')[0]
            } else {
                const defaultExp = new Date();
                defaultExp.setDate(defaultExp.getDate() + 30);
                selectedDate = defaultExp.toISOString().split('T')[0];
            }

            const res = await setOfficialPartner(job.id, 0, selectedDate)
            if (res.success) {
                alert('공식 파트너로 등록되었습니다.')
                fetchJobs()
            } else {
                alert(res.error)
            }
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
            <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border flex gap-4">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md flex items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus-within:border-amber-300 transition-all shadow-sm overflow-hidden">
                    <select
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border py-2.5 px-3 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
                    >
                        <option value="ALL">전체</option>
                        <option value="JOB_NO">공고번호</option>
                        <option value="USER_ID">가입ID</option>
                        <option value="NAME">이름(대표자)</option>
                        <option value="BIZ_NAME">상호명</option>
                        <option value="TITLE">공고제목</option>
                    </select>
                    <input
                        type="text"
                        placeholder="검색어 입력 후 엔터..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-3 pr-4 py-2.5 bg-transparent text-sm font-bold flex-1 outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                    <button type="submit" className="hidden">검색</button>
                </form>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold">보기:</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className="bg-white border dark:border-dark-border hover:border-amber-300 rounded text-xs px-1 py-0.5 outline-none font-bold"
                        >
                            {[10, 20, 30, 40, 50, 100].map(n => (
                                <option key={n} value={n}>{n}개씩</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">전체:</span>
                        <span className="text-xs font-black text-amber-500">{total}건</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                    <thead>
                        <tr className="border-b dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300">
                            {['사진', '배너생성', '번호', '지역', '직종', '이름', '연락처', '상호명', '공고제목', '등급', '남은기간', '점프설정', '상태', '조회', '관리', '복사'].map((header, index) => {
                                const isSortable = ['번호', '등급', '남은기간'].includes(header)
                                const sortKeyMatch = header === '번호' ? 'job_no' : header === '등급' ? 'grade' : 'expired_at'
                                const isActiveSort = sortConfig?.key === sortKeyMatch

                                return (
                                    <th key={`${header}-${index}`} style={{ width: header === '복사' ? 100 : header === '관리' ? 90 : colWidths[index] }} className="p-4 font-bold text-[12px] relative border-r border-gray-100 dark:border-dark-border last:border-0 whitespace-nowrap">
                                        <div
                                            className={`flex items-center gap-1 ${isSortable ? 'cursor-pointer hover:text-amber-500 transition-colors' : ''}`}
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
                                            <span className={`flex items-center gap-1.5 ${isActiveSort ? 'text-amber-500' : ''}`}>
                                                {header}
                                                {isSortable && (
                                                    <ArrowUpDown size={12} className={`${isActiveSort ? 'text-amber-500' : 'text-gray-300 opacity-50'} transition-opacity`} />
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedJobs.map(job => (
                            <tr key={job.id} className="border-b dark:border-dark-border hover:bg-amber-50/10 dark:hover:bg-pink-900/10 transition-colors text-[13px]">
                                <td className="p-4 align-top">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-dark-bg rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 dark:border-dark-border shadow-sm shrink-0">
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
                                        onClick={() => setGeneratingBannerJob({ id: job.id, title: job.employer?.business_name || '업소명' })}
                                        className="px-2 py-1.5 flex items-center justify-center gap-1 bg-gradient-to-r from-amber-500 to-purple-500 text-white text-[10px] font-black rounded-lg hover:opacity-90 transition-opacity shadow-md min-w-[60px]"
                                    >
                                        ✨ 생성
                                    </button>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <span className="font-black text-gray-400">#{job.job_no}</span>
                                </td>

                                <td className="p-4 align-top truncate text-gray-600 dark:text-gray-400 font-bold" title={job.region?.name || '-'}>
                                    {job.region?.name || '-'}
                                </td>

                                <td className="p-4 align-top truncate text-gray-600 dark:text-gray-400 font-bold" title={job.category?.name || '-'}>
                                    <span className="bg-gray-100 dark:bg-dark-bg px-2 py-1 rounded text-[11px] font-black">{job.category?.name || '-'}</span>
                                </td>

                                <td className="p-4 align-top truncate" title={job.employer?.user?.name || job.employer?.owner_name || '이름미상'}>
                                    <p className="font-black text-gray-800 dark:text-gray-100 cursor-pointer hover:text-amber-500" onClick={() => job.employer?.user?.id && setSelectedUserId(job.employer.user.id)}>
                                        {job.employer?.user?.name || job.employer?.owner_name || '미상'}
                                    </p>
                                </td>

                                <td className="p-4 align-top truncate text-gray-500 font-bold" title={job.employer?.phone || job.employer?.user?.phone || '-'}>
                                    {job.employer?.phone || job.employer?.user?.phone || '-'}
                                </td>

                                <td className="p-4 align-top truncate font-black text-gray-700 dark:text-gray-300" title={job.employer?.business_name || '-'}>
                                    {job.employer?.business_name || '-'}
                                </td>

                                <td className="p-4 align-top">
                                    <div 
                                        className="relative"
                                        onMouseEnter={() => setHoveredJob({ job, x: 0, y: 0 })}
                                        onMouseMove={(e) => setHoveredJob(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                                        onMouseLeave={() => setHoveredJob(null)}
                                    >
                                        <Link href={buildJobSeoUrl(job as any)} target="_blank" className="font-black text-gray-900 dark:text-white hover:text-amber-500 hover:underline line-clamp-1 leading-tight">
                                            {job.title}
                                        </Link>
                                    </div>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${job.exposure_level === 'VVIP' ? 'bg-amber-100 text-amber-600' : job.exposure_level === 'VIP' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {job.exposure_level}
                                        </span>
                                        {!job.is_official_partner && (
                                            <button 
                                                onClick={() => handleOfficialPartnerToggle(job)}
                                                disabled={loading === job.id}
                                                className="px-2 py-1 bg-white dark:bg-dark-bg border border-amber-200 dark:border-pink-900/30 text-amber-500 text-[9px] font-black rounded-md hover:bg-amber-50 transition shadow-sm flex items-center gap-1"
                                            >
                                                <Star size={10} fill={job.is_official_partner ? "currentColor" : "none"} /> 공식파트너+
                                            </button>
                                        )}
                                        {job.is_official_partner && (
                                            <span className="text-[9px] font-black text-amber-500 flex items-center gap-0.5">👑 파트너</span>
                                        )}
                                    </div>
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
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-dark-card shadow-2xl border border-gray-100 dark:border-dark-border p-4 rounded-xl w-48 space-y-3 z-50 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                                <div className="text-left">
                                                    <label className="text-[9px] font-black text-gray-400 mb-1 block uppercase">남은 횟수</label>
                                                    <input id={`jump-count-${job.id}`} type="number" className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-sm font-bold" defaultValue={job.remaining_auto_jumps} />
                                                </div>
                                                <div className="text-left">
                                                    <label className="text-[9px] font-black text-gray-400 mb-1 block uppercase">간격 (분)</label>
                                                    <input id={`jump-interval-${job.id}`} type="number" className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-2 py-1.5 text-sm font-bold" defaultValue={job.auto_jump_interval_min} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-gray-500">자동 활성</span>
                                                    <button
                                                        id={`jump-enabled-${job.id}`}
                                                        data-enabled={job.is_auto_jump_enabled}
                                                        onClick={(e) => {
                                                            const btn = e.currentTarget;
                                                            const enabled = btn.getAttribute('data-enabled') !== 'true';
                                                            btn.setAttribute('data-enabled', enabled.toString());
                                                            btn.textContent = enabled ? 'ON' : 'OFF';
                                                            btn.className = `px-3 py-1 rounded-lg text-[10px] font-black ${enabled ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`;
                                                        }}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-black ${job.is_auto_jump_enabled ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                                    >
                                                        {job.is_auto_jump_enabled ? 'ON' : 'OFF'}
                                                    </button>
                                                </div>
                                                <button onClick={() => {
                                                    const jumpCount = parseInt((document.getElementById(`jump-count-${job.id}`) as HTMLInputElement).value)
                                                    const intervalMin = parseInt((document.getElementById(`jump-interval-${job.id}`) as HTMLInputElement).value)
                                                    const isEnabled = document.getElementById(`jump-enabled-${job.id}`)?.getAttribute('data-enabled') === 'true'
                                                    handleJumpEdit(job.id, { jumpCount, intervalMin, isEnabled })
                                                }} className="w-full py-2 bg-gray-900 text-white rounded-lg text-[11px] font-black hover:bg-amber-500 transition">저장</button>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <select
                                        value={job.status}
                                        onChange={(e) => handleAction(job.id, e.target.value)}
                                        disabled={loading === job.id}
                                        className={`px-2 py-1 rounded-md text-[11px] font-black border outline-none cursor-pointer text-center appearance-none transition-colors shadow-sm ${
                                            job.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                            job.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' :
                                            'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        <option value="ACTIVE" className="bg-white text-green-700 font-bold">🟢 게시중</option>
                                        <option value="PENDING" className="bg-white text-yellow-700 font-bold">🟡 승인대기</option>
                                        <option value="REJECTED" className="bg-white text-gray-500 font-bold">⚪ 블라인드</option>
                                    </select>
                                </td>

                                <td className="p-4 align-top text-center font-bold text-gray-400 text-[11px]">
                                    {job.view_count.toLocaleString()}
                                </td>

                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-1 items-stretch w-[60px]">
                                        <Link href={`/admin/jobs/${job.id}/edit`} className="bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white px-2 py-1.5 rounded-lg text-[11px] font-black hover:bg-gray-800 transition text-center w-full block">수정</Link>
                                        <button onClick={() => handleAction(job.id, 'DELETE')} disabled={loading === job.id} className="bg-red-50 text-red-600 border border-red-100 px-2 py-1.5 rounded-lg text-[11px] font-black hover:bg-red-500 hover:text-white transition w-full text-center">
                                            {loading === job.id ? '...' : '삭제'}
                                        </button>
                                    </div>
                                </td>
                                
                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-1 items-stretch w-[86px]">
                                        <button onClick={() => handleClone(job.id, false)} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 px-2 py-1.5 rounded-lg text-[11px] font-black hover:bg-gray-50 transition w-full text-center">복사</button>
                                        <button onClick={() => handleClone(job.id, true)} className="bg-amber-50 dark:bg-pink-900 border border-amber-200 dark:border-pink-800 text-amber-600 dark:text-amber-300 px-2 py-1.5 rounded-lg text-[11px] font-black hover:bg-amber-100 transition whitespace-nowrap text-center">복사(기간포함)</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedJobs.length === 0 && (
                            <tr>
                                <td colSpan={16} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">No Jobs Found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {isLoading && (
                    <div className="p-20 text-center bg-white/50 dark:bg-black/50 backdrop-blur-sm absolute inset-0 flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="p-6 flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border rounded-b-2xl">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                        title="첫 페이지"
                    >
                        &laquo;
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                    >
                        이전
                    </button>
                    {pagesInGroup.map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-black transition-all flex items-center justify-center shrink-0 ${currentPage === page ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
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
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                        title="마지막 페이지"
                    >
                        &raquo;
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
                        setJobs(prev => prev.map(j => j.id === generatingBannerJob.id ? { ...j, logo_url: url } : j))
                        setGeneratingBannerJob(null)
                    }}
                />
            )}
            {/* 공고 미리보기 팝업 (Hover) */}
            {hoveredJob && (
                <div 
                    className="fixed z-[9999] pointer-events-none p-4 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-2xl flex gap-4 items-center w-[340px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: hoveredJob.x + 20, top: hoveredJob.y + 20 }}
                >
                    <div className="w-16 h-16 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {hoveredJob.job.logo_url ? (
                            <img src={hoveredJob.job.logo_url} className="w-full h-full object-cover" />
                        ) : hoveredJob.job.images?.[0] ? (
                            <img src={hoveredJob.job.images[0]} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-black text-gray-300">NO IMG</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                            <span className="font-black text-gray-900 dark:text-gray-100 line-clamp-1">{hoveredJob.job.business_name || hoveredJob.job.employer?.business_name || '상호미표기'}</span>
                            <span className="text-gray-400">· {hoveredJob.job.status === 'ACTIVE' ? '광고중' : '승인대기'}</span>
                        </div>
                        <div className="font-black text-[13px] text-gray-900 dark:text-gray-100 truncate mb-1">{hoveredJob.job.title}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <span className="font-black text-amber-500">
                                {hoveredJob.job.salary_type === 'NEGOTIABLE' ? '급여협의' : `${hoveredJob.job.salary_type === 'TC' ? '티씨' : '시급'} ${hoveredJob.job.salary_amount ? `${Math.floor(hoveredJob.job.salary_amount/10000)}만원` : '-'}`}
                            </span>
                            <span>|</span>
                            <span className="truncate">{hoveredJob.job.region?.name?.split(' ').pop() || '전국'}</span>
                            <span>|</span>
                            <span>{hoveredJob.job.category?.name || '기타'}</span>
                        </div>
                        <div className="mt-2 flex gap-1.5 items-center">
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-bg text-gray-400 rounded text-[9px] font-black uppercase">#{hoveredJob.job.job_no}</span>
                            {hoveredJob.job.remaining_auto_jumps > 0 && (
                                <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded text-[9px] font-black uppercase">🚀 {hoveredJob.job.remaining_auto_jumps}</span>
                            )}
                            {hoveredJob.job.expired_at && calculateDaysLeft(hoveredJob.job.expired_at)! > 0 && (
                                <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-pink-900/30 text-amber-500 rounded text-[9px] font-black uppercase">D-{calculateDaysLeft(hoveredJob.job.expired_at)}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
