'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Rocket, Edit3, Plus, ArrowLeft, Crown, Sparkles, LogOut, User, MessageSquare, X, CreditCard, Settings, RefreshCw, Briefcase, Building2, ChevronRight, ReceiptText, Clock, Copy, Check, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildJobSeoUrl } from '@/lib/seoUrls'

export default function EmployerDashboard() {
    const [loading, setLoading] = useState(true)
    const [employer, setEmployer] = useState<any>(null)
    const [jobs, setJobs] = useState<any[]>([])
    const [siteConfig, setSiteConfig] = useState<any>(null)
    const [isJumping, setIsJumping] = useState<string | null>(null)
    const [updatingAutoJump, setUpdatingAutoJump] = useState<string | null>(null)
    const [selectedJobForModal, setSelectedJobForModal] = useState<any>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const fetchData = async () => {
        try {
            const res = await fetch('/api/employer/me', { cache: 'no-store' })
            const data = await res.json()

            if (res.status === 404) {
                setEmployer(null)
                setJobs([])
                setLoading(false)
                return
            }

            if (!res.ok) throw new Error(data.error)
            setEmployer(data.employer)
            setJobs(data.jobs || [])
            setSiteConfig(data.siteConfig)
        } catch (err: any) {
            console.error("Dashboard Fetch Error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleJump = async (jobId: string) => {
        setIsJumping(jobId)
        try {
            const res = await fetch('/api/jobs/jump', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            const poolMsg = data.pool === 'job'
                ? `(남은 횟수: ${data.remainingJobsPoints}회)`
                : ''

            alert(`${data.message} ${poolMsg}`)
            fetchData()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsJumping(null)
        }
    }

    const updateAutoJumpSettings = async (jobId: string, enabled: boolean, interval: number, remainingJumps?: number) => {
        setUpdatingAutoJump(jobId)
        try {
            const res = await fetch(`/api/jobs/${jobId}/auto-jump`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isAutoJumpEnabled: enabled,
                    intervalMin: interval,
                    remainingAutoJumps: remainingJumps
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            alert('설정이 저장되었습니다.')
            fetchData()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setUpdatingAutoJump(null)
        }
    }


    if (loading) return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-dark-bg text-gray-800 dark:text-gray-100 font-sans pb-28">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border px-6 h-16 flex items-center gap-4 text-amber-500">
                <Link href="/mypage" className="p-2 hover:bg-amber-50 dark:hover:bg-pink-950/20 rounded-full transition text-gray-400 hover:text-amber-500">
                    <ArrowLeft size={22} />
                </Link>
                <div className="flex-1 flex items-center gap-2">
                    <Briefcase size={22} className="text-amber-500" />
                    <h1 className="text-lg font-black tracking-tighter uppercase text-gray-900 dark:text-gray-100">사장님 전용관</h1>
                </div>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut()
                        window.location.href = '/'
                    }}
                    className="flex items-center gap-2 p-2 hover:bg-amber-50 dark:hover:bg-pink-950/20 rounded-xl transition text-[13px] font-black text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400"
                >
                    <LogOut size={20} />
                    <span className="hidden md:inline">로그아웃</span>
                </button>
            </nav>

            <main className="max-w-xl mx-auto px-6 mt-10">
                {/* Profile Summary - Horizontal Compact UI */}
                <section className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[32px] p-6 mb-8 shadow-soft flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center text-blue-500 flex-shrink-0 border-2 border-white dark:border-dark-border shadow-sm">
                        <Building2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-[18px] font-black text-gray-900 dark:text-gray-100 truncate tracking-tight">
                                {employer?.business_name || '상호명 미등록'}
                            </h2>
                            <span className="px-2 py-0.5 bg-blue-500 text-white rounded-md text-[9px] font-black tracking-tight whitespace-nowrap">
                                업소회원
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] text-gray-400 dark:text-gray-500 font-bold tracking-tight">
                                CEO {employer?.owner_name || '관리자'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Banner for missing business registration */}
                {!employer && (
                    <div className="bg-amber-50 dark:bg-pink-950/20 border border-amber-200 dark:border-pink-900/50 rounded-[24px] p-5 mb-10 flex flex-col gap-3 shadow-sm animate-pulse">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black">
                            <Sparkles size={18} /> 사업자 인증이 필요해요!
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-[13px] font-bold leading-relaxed">
                            공고 노출 및 프리미엄 혜택을 온전히 누리시려면 사업자등록증 인증이 필수입니다! 미리 인증해두시면 더 빠른 공고 노출이 가능합니다.
                        </p>
                        <Link href="/employer/business" className="mt-2 bg-amber-500 text-white text-[13px] font-black py-3 rounded-xl text-center active:scale-95 transition-transform shadow-md">
                            간편하게 인증하러 가기
                        </Link>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-4 mb-12">
                    <button onClick={() => {
                        router.push('/employer/jobs/new');
                    }} className="w-full flex items-center justify-between bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 rounded-[30px] hover:border-amber-300 dark:hover:border-pink-900/50 transition shadow-soft group active:scale-[0.98]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-pink-950/30 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition">
                                <Plus size={24} />
                            </div>
                            <div className="text-left">
                                <span className="block text-[15px] font-black text-gray-900 dark:text-gray-100">새로운 구인공고 등록</span>
                                <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500">빠르고 간편하게 인재를 찾아보세요</span>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-200 group-hover:text-amber-500 transition-colors" />
                    </button>

                    <button onClick={() => {
                        router.push('/employer/payments');
                    }} className="w-full flex items-center justify-between bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 rounded-[30px] hover:border-amber-300 dark:hover:border-pink-900/50 transition shadow-soft group active:scale-[0.98]">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-dark-bg rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition">
                                <CreditCard size={20} />
                            </div>
                            <div className="text-left">
                                <span className="block text-[14px] font-black text-gray-900 dark:text-gray-100">나의 광고 결제 내역</span>
                                <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500">결제 현황 확인 및 공고 바로가기</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-200 group-hover:text-amber-500 transition-colors" />
                    </button>
                </div>

                {/* Listings */}
                <section>
                    <div className="flex items-center justify-between mb-8 pl-1">
                        <h3 className="text-[14px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
                            내가 올린 공고 <span className="text-amber-500">{jobs.length}</span>
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {jobs.map(job => (
                            <div key={job.id} className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[30px] p-6 hover:border-amber-50 dark:hover:border-pink-900/30 transition shadow-sm relative overflow-hidden">
                                {job.is_auto_jump_enabled && job.status === 'ACTIVE' && (
                                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-bl-2xl flex items-center gap-1.5 animate-pulse">
                                        <RefreshCw size={10} className="animate-spin" /> 자동 점프 가동중
                                    </div>
                                )}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1 cursor-pointer" onClick={() => router.push(buildJobSeoUrl(job))}>
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className="bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 text-[10px] font-black px-2 py-0.5 rounded border border-gray-200 dark:border-dark-border shadow-sm">
                                                NO.{job.job_no}
                                            </span>
                                            {job.expired_at && (
                                                (() => {
                                                    const diff = new Date(job.expired_at).getTime() - new Date().getTime();
                                                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                    const isCritical = days <= 5;
                                                    return (
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border shadow-sm ${isCritical
                                                            ? 'bg-amber-50 dark:bg-pink-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-pink-900/50 animate-pulse'
                                                            : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50'
                                                            }`}>
                                                            마감 {days > 0 ? `${days}일 전` : '당일/만료'}
                                                        </span>
                                                    );
                                                })()
                                            )}
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm ${job.status === 'PENDING' ? 'bg-yellow-400 text-white' :
                                                job.exposure_level === 'VVIP' ? 'bg-amber-500 text-white' : 'bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white'
                                                }`}>
                                                {job.status === 'PENDING' ? '결제대기' : job.exposure_level}
                                            </span>
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold">{job.region?.name || '지역명'} · {job.category?.name || '직종'}</span>
                                        </div>
                                        <h4 className="text-[16px] font-black text-gray-900 dark:text-gray-100 leading-tight hover:text-amber-500 transition">{job.title}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[15px] font-black text-amber-500">{job.salary_info}</p>
                                        <p className="text-[10px] text-gray-300 dark:text-gray-500 font-medium mt-1">
                                            최근 점프: {new Date(job.last_jumped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Auto Jump Settings Section */}
                                {job.status === 'ACTIVE' && (
                                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-4 mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Settings size={14} className="text-gray-400 dark:text-gray-600" />
                                                <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">자동 점프 설정</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={job.is_auto_jump_enabled}
                                                    disabled={updatingAutoJump === job.id}
                                                    onChange={(e) => updateAutoJumpSettings(job.id, e.target.checked, job.auto_jump_interval_min)}
                                                />
                                                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                            </label>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1 ml-1">반복 간격 (분 단위)</p>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-[13px] font-black outline-none focus:border-amber-300 transition text-gray-900 dark:text-gray-100"
                                                            value={job.auto_jump_interval_min}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0
                                                                setJobs(prev => prev.map(j => j.id === job.id ? { ...j, auto_jump_interval_min: val } : j))
                                                            }}
                                                        />
                                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 shrink-0">분 마다</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1 ml-1">남은 횟수 수정</p>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-[13px] font-black outline-none focus:border-amber-300 transition text-gray-900 dark:text-gray-100"
                                                            value={job.remaining_auto_jumps}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0
                                                                setJobs(prev => prev.map(j => j.id === job.id ? { ...j, remaining_auto_jumps: val } : j))
                                                            }}
                                                        />
                                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 shrink-0">회</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={updatingAutoJump === job.id}
                                                onClick={() => {
                                                    updateAutoJumpSettings(job.id, job.is_auto_jump_enabled, job.auto_jump_interval_min, job.remaining_auto_jumps)
                                                }}
                                                className="w-full py-3 bg-amber-500 text-white rounded-xl text-[12px] font-black hover:bg-amber-600 transition active:scale-[0.98] shadow-lg shadow-amber-100 dark:shadow-none disabled:opacity-50"
                                            >
                                                {updatingAutoJump === job.id ? '저장 중...' : '✅ 점프 및 간격 설정 저장'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!job.expired_at || (job.remaining_auto_jumps === undefined)) {
                                                        alert('광고 마감일과 남은 점프 횟수가 있어야 계산이 가능합니다.')
                                                        return
                                                    }
                                                    const now = new Date()
                                                    const expiry = new Date(job.expired_at)
                                                    const diffMs = expiry.getTime() - now.getTime()
                                                    if (diffMs <= 0) {
                                                        alert('광고 기한이 이미 지났습니다.')
                                                        return
                                                    }
                                                    const diffMin = Math.floor(diffMs / 60000)
                                                    const interval = Math.floor(diffMin / job.remaining_auto_jumps)
                                                    const finalInterval = Math.max(10, interval) // Minimum 10 mins

                                                    if (confirm(`남은 광고 기간(${Math.floor(diffMin / 1440)}일) 동안 점프 ${job.remaining_auto_jumps}회를 모두 사용하도록 간격을 ${finalInterval}분으로 자동 설정하시겠습니까?`)) {
                                                        // Optimistic update
                                                        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, auto_jump_interval_min: finalInterval } : j))
                                                        updateAutoJumpSettings(job.id, job.is_auto_jump_enabled, finalInterval, job.remaining_auto_jumps)
                                                    }
                                                }}
                                                className="w-full py-3 bg-white dark:bg-dark-card border border-blue-200 dark:border-blue-900/50 text-blue-500 rounded-xl text-[11px] font-black hover:bg-blue-50 dark:hover:bg-blue-950/20 transition active:scale-[0.98]"
                                            >
                                                🕒 마감일에 맞춰 간격 자동 계산
                                            </button>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold px-1 leading-relaxed text-center">
                                                * 남은 광고 기간 동안 보유한 점프를 골고루 모두 소진하도록 최적의 간격을 계산하여 입력합니다.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {job.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const lastPayment = job.payments?.[0];
                                                    if (lastPayment && lastPayment.status === 'PENDING') {
                                                        setSelectedJobForModal(job);
                                                        setIsPaymentModalOpen(true);
                                                    } else {
                                                        router.push(`/employer/jobs/${job.id}/payment`)
                                                    }
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl text-[12px] font-black transition active:scale-[0.98] border-2 ${job.payments?.[0]?.status === 'PENDING'
                                                    ? 'bg-gray-900 dark:bg-black text-white border-gray-800'
                                                    : 'bg-gray-900 dark:bg-black text-amber-500 border-amber-500 hover:bg-gray-800'
                                                    }`}
                                            >
                                                {job.payments?.[0]?.status === 'PENDING' ? (
                                                    <>
                                                        <RefreshCw size={14} className="animate-spin text-gray-400" />
                                                        <span>승인 대기중</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard size={14} />
                                                        <span>결제 확인 / 활성</span>
                                                    </>
                                                )}
                                            </button>
                                            <Link href={`/employer/jobs/${job.id}/edit`} className="w-14 h-14 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-card transition group flex-shrink-0">
                                                <Edit3 size={18} className="text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                                            </Link>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('정말 삭제하시겠습니까?')) {
                                                        const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
                                                        if (res.ok) fetchData()
                                                    }
                                                }}
                                                className="w-14 h-14 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center justify-center hover:bg-red-500 group transition flex-shrink-0"
                                            >
                                                <X size={20} className="text-red-300 dark:text-red-700 group-hover:text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleJump(job.id)}
                                                    disabled={isJumping === job.id}
                                                    className="w-full bg-gray-900 dark:bg-black hover:bg-black dark:hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 py-4 rounded-2xl text-[13px] font-black text-white shadow-lg transition relative"
                                                >
                                                    <Rocket size={16} />
                                                    <span className="text-center">
                                                        {isJumping === job.id ? '점프 중...' : '실시간 점프'}
                                                    </span>
                                                    {job.remaining_auto_jumps > 0 && (
                                                        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                                                            {job.remaining_auto_jumps}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/employer/jobs/${job.id}/payment`)}
                                                    className="w-full bg-gray-900 dark:bg-black border-2 border-amber-500 text-amber-500 hover:bg-gray-800 active:scale-[0.98] flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[12px] font-black shadow-sm transition"
                                                >
                                                    <Zap size={15} />
                                                    <span>공고 연장 하기</span>
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Link href={`/employer/jobs/${job.id}/edit`} className="w-14 h-14 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-card transition group flex-shrink-0">
                                                    <Edit3 size={18} className="text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                                                </Link>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('정말 삭제하시겠습니까?')) {
                                                            const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
                                                            if (res.ok) fetchData()
                                                        }
                                                    }}
                                                    className="w-14 h-14 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center justify-center hover:bg-red-500 group transition flex-shrink-0"
                                                >
                                                    <X size={20} className="text-red-300 dark:text-red-700 group-hover:text-white" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {jobs.length === 0 && (
                            <div className="py-24 text-center bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[40px] shadow-sm">
                                <Plus size={48} className="text-gray-100 dark:text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-400 dark:text-gray-500 text-sm font-bold mb-6">등록된 공고가 없습니다.</p>
                                <button onClick={() => {
                                    router.push('/employer/jobs/new');
                                }} className="px-8 py-4 bg-amber-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-amber-100 hover:scale-105 transition active:scale-95 inline-block">
                                    첫 공고 등록하기
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Payment Info Modal */}
            {isPaymentModalOpen && selectedJobForModal && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-32">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-dark-card w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-10 duration-500">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock size={32} className="text-amber-500 animate-pulse" />
                            </div>
                            <h3 className="text-[20px] font-black text-gray-900 dark:text-gray-100 mb-2">승인 대기중</h3>
                            <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                입금 확인 후 영업일 기준 1시간 이내에<br />
                                관리자가 승인하면 즉시 노출됩니다.
                            </p>

                            <div className="bg-gray-50 dark:bg-dark-bg rounded-2xl p-5 mb-8 border border-gray-100 dark:border-dark-border text-left">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[12px]">
                                        <span className="text-gray-400 font-bold">입금 계좌</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-black">{siteConfig?.bank_name || '국민은행'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold text-[12px]">계좌 번호</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[15px] font-black text-amber-500">{siteConfig?.bank_account || '219401-04-263185'}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(siteConfig?.bank_account || '219401-04-263185');
                                                    setIsCopied(true);
                                                    setTimeout(() => setIsCopied(false), 2000);
                                                }}
                                                className={`p-1.5 rounded-lg transition-all active:scale-90 ${isCopied ? 'bg-green-500 text-white' : 'bg-white dark:bg-dark-card text-gray-400 border border-gray-100 dark:border-dark-border'}`}
                                            >
                                                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[12px]">
                                        <span className="text-gray-400 font-bold">예금주</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-black">{siteConfig?.bank_owner || '세컨즈나인'}</span>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-dark-border my-1"></div>
                                    <div className="flex justify-between items-center text-[12px]">
                                        <span className="text-gray-400 font-bold">신청 입금자명</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-black">{selectedJobForModal.payments?.[0]?.depositor_name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-amber-50/50 dark:bg-pink-950/10 rounded-xl py-3 px-4 border border-amber-100 dark:border-pink-900/20">
                                    <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 text-center">
                                        고객센터: 1899-0930
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="w-full py-4 bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white rounded-2xl text-[14px] font-black hover:scale-[1.02] transition active:scale-[0.98]"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}

