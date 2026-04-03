'use client'
import React, { useState, useEffect } from 'react'
import { ChevronLeft, Bookmark, ChevronRight, Share2, MoreVertical, MapPin, Clock, Calendar, CheckCircle2, ChevronDown, Map, Building2, Phone, MessageSquare, AlertTriangle, Shield, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useModal } from '@/providers/ModalProvider'
import { createPortal } from 'react-dom'
import FloatingJobChat from '@/components/chat/FloatingJobChat'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface JobDetailClientProps {
    job: any
}

export default function JobDetailClient({ job }: JobDetailClientProps) {
    const router = useRouter()
    const { showError } = useModal()
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('상세정보')
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id || null)
        }
        checkUser()
    }, [])

    const adDays = React.useMemo(() => {
        if (!job.created_at) return 1
        return Math.max(1, Math.ceil((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    }, [job.created_at])


    const toggleBookmark = () => setIsBookmarked(!isBookmarked)

    const handleChatClick = () => {
        if (!currentUserId) {
            showError('로그인이 필요한 기능입니다.')
            return
        }
        setIsChatOpen(true)
    }

    const formatDate = (date: any) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="bg-gray-50 dark:bg-dark-bg">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border flex items-center justify-between px-1.5 h-[46px]">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-1.5 pr-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors mr-0">
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <div className="w-[26px] h-[26px] rounded-full bg-[#ff8c00] flex-shrink-0"></div>
                        <div className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-1 tracking-tight">
                            {job.business_name || job.employer?.business_name || '회사명'}
                            <span className="text-gray-400 font-medium text-[12px] tracking-normal" suppressHydrationWarning>
                                · {isMounted ? adDays : '...'}일째 광고중
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto">
                {/* 포스터 이미지 영역 (로고 및 사진) */}
                <div className="bg-white dark:bg-dark-card">
                    {/* 1. 대표 로고 (상단 메인) */}
                    {job.logo_url && (
                        <div className="w-full aspect-[16/9] relative bg-gray-900 overflow-hidden border-b border-gray-100 dark:border-dark-border">
                            {/* 배경 블러 효과 - 최적화 버전 (더 깊은 블러와 높은 대비) */}
                            <div className="absolute inset-0 overflow-hidden bg-black">
                                <Image 
                                    src={job.logo_url} 
                                    alt="Background Blur"
                                    fill
                                    unoptimized
                                    className="object-cover blur-3xl opacity-60 scale-150 rotate-3" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-[1]" />
                            </div>
                            {/* 메인 로고 이미지 */}
                            <div className="absolute inset-0 flex items-center justify-center z-10 px-10">
                                <div className="relative w-full h-[85%]">
                                    <Image 
                                        src={job.logo_url} 
                                        alt="Banner"
                                        fill
                                        priority
                                        unoptimized
                                        className="object-contain rounded-lg shadow-2xl" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. 공고 사진 갤러리 (현장 사진들) */}
                    {job.images && job.images.length > 0 && (
                        <div className="px-5 py-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <ImageIcon size={18} className="text-amber-500" />
                                <span className="text-[15px] font-black text-gray-900 dark:text-gray-100">현장 사진</span>
                                <span className="text-gray-400 text-[13px] font-bold">{job.images.length}장</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {job.images.map((img: any, idx: number) => (
                                    <div key={idx} className="w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border shadow-sm relative aspect-[4/3]">
                                        <Image
                                            src={img.image_url || img}
                                            alt={`공고사진 ${idx + 1}`}
                                            fill
                                            unoptimized
                                            className="object-cover hover:scale-[1.02] transition-transform duration-500"
                                            sizes="(max-width: 672px) 100vw, 672px"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 1. 핵심 요약 영역 */}
                <section className="bg-white dark:bg-dark-card px-5 pt-4 pb-4">
                    <h1 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.3] break-keep mb-1.5">
                        {job.title}
                    </h1>

                    <div className="flex items-center flex-wrap gap-1.5 text-[14px] mb-4 font-bold">
                        <span className="text-[#8D6E63]">
                            {job.salary_info ? (
                                (() => {
                                    const parts = job.salary_info.split(/(\d+[,0-9]*)/);
                                    return parts.map((part: string, index: number) =>
                                        /\d+[,0-9]*/.test(part)
                                            ? <span key={index} className="text-white mx-0.5">{part}</span>
                                            : <span key={index}>{part}</span>
                                    );
                                })()
                            ) : (
                                '급여 협의'
                            )}
                        </span>
                        <span className="text-[#8D6E63] opacity-50">·</span>
                        <span className="text-[#8D6E63]">{job.region?.name || '지역 무관'}</span>
                        <span className="text-[#8D6E63] opacity-50">·</span>
                        <span className="text-[#8D6E63]">{job.category?.name || '일반채용'}</span>
                    </div>

                    <div className="bg-[#f8f9fa] dark:bg-dark-bg rounded py-1.5 px-3 flex flex-col items-center justify-center gap-0">
                        <p className="text-[14px] font-bold text-gray-800 dark:text-gray-200">"1:1 채팅"으로 연락하세요.</p>
                        <p className="text-[12px] text-gray-500">내 연락처가 노출되지 않아요.</p>
                    </div>
                </section>

                {/* 2. 본문 상세 내용 - Trial 2: Force Dark (Clean) */}
                <div className="bg-white dark:bg-dark-card px-5 py-8 mt-2 overflow-x-hidden">
                        <div
                            className="max-w-full mx-auto text-[15px] leading-[1.9] text-gray-800 dark:text-gray-100 break-all whitespace-pre-wrap min-h-[300px] text-center job-description-content dark:[&_*]:bg-transparent! dark:[&_*]:text-gray-100! [&_p]:mb-3 [&_img]:max-w-full [&_img]:h-auto [&_img]:mx-auto [&_img]:rounded-lg [&_*]:max-w-full [&_*]:box-border [&_*]:break-all! [&_*]:whitespace-pre-wrap!"
                            dangerouslySetInnerHTML={{ __html: job.description || '<p class="text-gray-400 text-center py-10">상세 내용이 없습니다.</p>' }}
                        />
                </div>

                {/* 주의사항 (Disclaimer) */}
                <div className="bg-[#f8f9fa] dark:bg-dark-bg px-5 py-5 mt-4 border-t-[6px] border-[#f8f9fa] dark:border-dark-bg">
                    <p className="text-[12px] leading-[1.6] text-gray-400 break-keep">
                        본 채용정보는 <span className="font-bold">{job.employer?.business_name || job.business_name || '해당 회사'}</span>에서 제공했어요. 본 회사는 게재된 정보의 정확성 및 이미지 저작권, 내용상의 오류나 지연, 사용자가 본 정보를 신뢰하여 취한 조치에 대해 책임지지 않기 때문에 상세 내용은 반드시 해당 기업에 직접 확인해주세요. 본 정보는 본 회사의 동의 없이 무단으로 복제하거나 재배포할 수 없어요.
                    </p>
                </div>

                {/* 3. 하단 상세 정보 블록 (담당자, 사업자, 광고기간) */}
                <div className="bg-white dark:bg-dark-card">

                    {/* 담당자 정보 */}
                    <div className="px-5 py-4 space-y-0 border-b-[6px] border-[#f8f9fa] dark:border-dark-bg">
                        <InfoRow label="담당자" value={job.manager_name || '미등록'} />
                        <InfoRow label="연락처" value={(job.contact_value || job.contact_info || '').replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3') || '미등록'} />
                    </div>

                    {/* 사업자 정보 */}
                    <div className="px-5 py-4 space-y-0 border-b-[6px] border-[#f8f9fa] dark:border-dark-bg">
                        <InfoRow label="사업자상호" value={job.official_business_name || job.employer?.business_name || '미등록'} />
                        <InfoRow label="사업자주소" value={job.business_address || job.employer?.address || '미등록'} />
                        <InfoRow label="세부주소" value={job.employer?.address_detail || ''} />
                        <InfoRow label="사업자대표" value={job.business_owner_name || job.employer?.owner_name || '미등록'} />
                        <InfoRow label="근무형태" value={job.working_type || '단기 / 협의'} />
                        <InfoRow label="고용형태" value={job.employment_type || '고용'} />
                    </div>

                    {/* 광고 기간 */}
                    <div className="px-5 py-2 space-y-0">
                        <InfoRow label="광고 시작" value={formatDate(job.created_at) || '미정'} />
                        <InfoRow label="광고 마감" value={formatDate(job.expired_at) || '미정'} />
                    </div>
                </div>
            </main>

            {/* 고정 하단 액션 바 (Portal을 사용하여 애니메이션 충돌 방지 및 완벽 고정) */}
            {isMounted ? createPortal(
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-[9999] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                    <div className="max-w-2xl mx-auto flex items-center gap-2.5 h-[52px]">
                        <button
                            onClick={toggleBookmark}
                            className={`w-[48px] h-[52px] flex items-center justify-center rounded-xl bg-white dark:bg-dark-card flex-shrink-0 transition-all active:scale-95`}
                        >
                            <Bookmark size={28} className={isBookmarked ? 'text-gray-900 dark:text-gray-100 fill-current' : 'text-gray-400 dark:text-gray-500'} strokeWidth={isBookmarked ? 1 : 1.5} />
                        </button>

                        <a
                            href={`tel:${job.contact_value || ''}`}
                            className="flex-1 h-full bg-[#f2f4f6] dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-bold rounded-xl flex items-center justify-center text-[15px] hover:bg-gray-200 dark:hover:bg-dark-border active:scale-95 transition-all"
                        >
                            전화하기
                        </a>

                        <button
                            onClick={handleChatClick}
                            className="flex-1 h-full bg-[#1e2025] text-white font-bold rounded-xl flex items-center justify-center text-[15px] hover:bg-gray-800 active:scale-95 transition-all"
                        >
                            1:1 채팅
                        </button>
                    </div>
                </div>,
                document.body
            ) : null}

            {/* 채팅 오버레이 */}
            {isChatOpen && currentUserId && (
                <FloatingJobChat
                    employerUserId={job.employer?.user_id}
                    employerBusinessName={job.employer?.business_name || '회사'}
                    currentUserId={currentUserId}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
        </div>
    )
}

function InfoRow({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) {
    if (!value) return null
    return (
        <div className="flex text-[12px] py-0">
            <span className="text-gray-400 w-[85px] flex-shrink-0">{label}</span>
            <span className={`font-medium ${highlight ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'}`}>{value}</span>
        </div>
    )
}

function ReportItem({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <button className="w-full flex items-center justify-between py-4 border-b border-gray-100 dark:border-dark-border last:border-0 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors group">
            <div className="flex items-center gap-3 text-gray-900">
                <span className="text-[14px] font-bold">{title}</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
        </button>
    )
}

