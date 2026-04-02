'use client'
import React, { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, ChevronDown, Bold, Type, Palette, AlignLeft, List, Underline, Strikethrough, Link as LinkIcon, Image as ImageIcon, Save } from 'lucide-react'

const CATEGORY_OPTIONS = [
    { name: '룸', slug: 'room' },
    { name: '노래주점', slug: 'karaoke' },
    { name: '텐프로/쩜오', slug: 'tenpro' },
    { name: '바/카페', slug: 'bar' },
    { name: '마사지', slug: 'massage' },
    { name: '기타유흥', slug: 'etc' },
]

const SALARY_TYPES = [
    { value: 'TC', label: '티씨 (T/C)' },
    { value: 'HOURLY', label: '시급' },
    { value: 'NEGOTIABLE', label: '협의' },
]

export default function AdminEditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [metadata, setMetadata] = useState<{ regions: any[] }>({ regions: [] })
    const [isEmbedded, setIsEmbedded] = useState(false)

    const [form, setForm] = useState({
        title: '',
        regionSlugs: [] as string[],
        categorySlug: 'room',
        salaryType: 'TC',
        salaryAmount: '',
        salaryInfo: '',
        ageMin: '20',
        ageMax: '',
        gender: '무관',
        description: '',
        convenienceTags: [] as string[],
        contactInfo: '',
        managerName: '',
        kakaoId: '',
        telegramId: '',
        lineId: '',
        logoUrl: '',
        imageUrls: [] as string[],
        workingType: '고용',
        businessName: '',
        jobNo: 0,
        // Admin-specific
        status: 'PENDING',
        remainingAutoJumps: 0,
        autoJumpIntervalMin: 144,
        vvipExpiredAt: null as string | null,
        vipExpiredAt: null as string | null,
        normalExpiredAt: null as string | null,
        // 추가 사업자 정보
        officialBusinessName: '',
        businessAddress: '',
        businessOwnerName: '',
        bannerUrl: '',
    })

    const [logoFile, setLogoFile] = useState<File | null>(null)
    const editorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search)
            if (searchParams.get('hideHeader') === 'true') {
                setIsEmbedded(true)
            }
        }

        const loadData = async () => {
            try {
                const metaRes = await fetch('/api/common/metadata')
                const metaData = await metaRes.json()
                setMetadata({ regions: metaData.regions })

                const jobRes = await fetch(`/api/jobs/${id}`)
                const jobData = await jobRes.json()
                if (jobRes.ok) {
                    setForm({
                        title: jobData.title || '',
                        regionSlugs: jobData.regions?.map((rj: any) => rj.region.slug) || [],
                        categorySlug: jobData.category?.slug || 'room',
                        salaryType: jobData.salary_type || 'TC',
                        salaryAmount: String(jobData.salary_amount || ''),
                        salaryInfo: jobData.salary_info || '',
                        ageMin: String(jobData.age_min || 20),
                        ageMax: String(jobData.age_max || ''),
                        gender: jobData.gender || '무관',
                        description: jobData.description || '',
                        convenienceTags: jobData.convenience_tags || [],
                        contactInfo: jobData.contact_info || '',
                        managerName: jobData.manager_name || '',
                        kakaoId: jobData.kakao_id || '',
                        telegramId: jobData.telegram_id || '',
                        lineId: jobData.line_id || '',
                        logoUrl: jobData.logo_url || '',
                        imageUrls: jobData.images?.map((im: any) => im.image_url) || [],
                        workingType: jobData.working_type || '고용',
                        status: jobData.status || 'PENDING',
                        remainingAutoJumps: jobData.remaining_auto_jumps || 0,
                        autoJumpIntervalMin: jobData.auto_jump_interval_min || 144,
                        vvipExpiredAt: jobData.vvip_expired_at || null,
                        vipExpiredAt: jobData.vip_expired_at || null,
                        normalExpiredAt: jobData.normal_expired_at || null,
                        businessName: jobData.business_name || '',
                        officialBusinessName: jobData.official_business_name || jobData.employer?.business_name || '',
                        businessAddress: jobData.business_address || jobData.employer?.address || '',
                        businessOwnerName: jobData.business_owner_name || jobData.employer?.owner_name || '',
                        bannerUrl: jobData.banner_url || '',
                        jobNo: jobData.job_no || 0,
                    })
                }
            } catch (err) { console.error(err) }
        }
        loadData()
    }, [id])

    // Initialize editor content once
    const initializedRef = useRef(false)
    useEffect(() => {
        if (editorRef.current && !initializedRef.current && form.description) {
            editorRef.current.innerHTML = form.description
            initializedRef.current = true
        }
    }, [form.description])

    const toggleRegion = (slug: string) => {
        setForm(prev => {
            const exists = prev.regionSlugs.includes(slug)
            if (exists) return { ...prev, regionSlugs: prev.regionSlugs.filter(s => s !== slug) }
            if (prev.regionSlugs.length >= 3) {
                alert('지역은 최대 3개까지만 선택 가능합니다.')
                return prev
            }
            return { ...prev, regionSlugs: [...prev.regionSlugs, slug] }
        })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value)
    }

    const handleFileUpload = async (files: File[], bucket: string = 'logos') => {
        const { createClient } = await import('@/lib/supabase/client')
        const { compressImage } = await import('@/lib/image-compression')
        const supabase = createClient()
        const urls = []
        for (const file of files) {
            // Compress image to 800px max (logos don't need to be huge)
            const compressedBlob = await compressImage(file, 800, 800, 0.8)
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`
            const filePath = `${bucket}/${fileName}`
            const { error } = await supabase.storage.from(bucket).upload(filePath, compressedBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            })
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
            urls.push(publicUrl)
        }
        return urls
    }

    const insertImageToEditor = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const urls = await handleFileUpload([file], 'job-images')
            const imgHtml = `<img src="${urls[0]}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`
            execCommand('insertHTML', imgHtml)
        } catch (error: any) {
            alert('이미지 업로드에 실패했습니다: ' + error.message)
        }
    }

    const handleJumpSave = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type: 'JOB_JUMP_EDIT',
                    jumpCount: Number(form.remainingAutoJumps),
                    intervalMin: Number(form.autoJumpIntervalMin),
                    vvip_expired_at: form.vvipExpiredAt,
                    vip_expired_at: form.vipExpiredAt,
                    normal_expired_at: form.normalExpiredAt
                })
            })
            if (!res.ok) throw new Error('업데이트 실패')
            alert('프리미엄 및 점프 설정이 저장되었습니다.')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const finalDescription = editorRef.current?.innerHTML || form.description
            let finalLogoUrl = form.logoUrl
            if (logoFile) {
                const urls = await handleFileUpload([logoFile], 'logos')
                finalLogoUrl = urls[0]
            }

            const salaryLabel = SALARY_TYPES.find(t => t.value === form.salaryType)?.label.split(' ')[0] || '티씨'
            const salaryInfoValue = form.salaryAmount ? `${salaryLabel} ${Number(form.salaryAmount).toLocaleString()}만원` : '협의'

            const res = await fetch(`/api/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    description: finalDescription,
                    logoUrl: finalLogoUrl,
                    salaryAmount: Number(form.salaryAmount) || 0,
                    salaryInfo: salaryInfoValue,
                    ageMin: Number(form.ageMin) || null,
                    ageMax: Number(form.ageMax) || null,
                    status: form.status,
                    remainingAutoJumps: Number(form.remainingAutoJumps) || 0,
                    autoJumpIntervalMin: Number(form.autoJumpIntervalMin) || 144,
                    vvip_expired_at: form.vvipExpiredAt,
                    vip_expired_at: form.vipExpiredAt,
                    normal_expired_at: form.normalExpiredAt,
                    // 추가 필드 연동
                    officialBusinessName: form.officialBusinessName,
                    businessAddress: form.businessAddress,
                    businessOwnerName: form.businessOwnerName,
                    bannerUrl: form.bannerUrl,
                })
            })

            if (!res.ok) throw new Error('수정 실패')
            alert('공고가 수정되었습니다.')
            router.push('/admin/jobs')
        } catch (error: any) { alert('오류: ' + error.message) }
        finally { setIsLoading(false) }
    }


    const getRegionName = (slug: string) => {
        for (const p of metadata.regions) {
            for (const c of p.children) {
                if (c.slug === slug) return `${p.name} ${c.name}`
            }
        }
        return '지역 선택'
    }
    const getCatName = (slug: string) => CATEGORY_OPTIONS.find(c => c.slug === slug)?.name || '직종 선택'
    const getSalaryName = (val: string) => SALARY_TYPES.find(t => t.value === val)?.label.split(' ')[0] || '티씨'

    return (
        <div className={`mx-auto pb-20 ${isEmbedded ? 'p-4 max-w-none w-full' : 'max-w-4xl'}`}>
            {!isEmbedded && (
                <header className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg transition shadow-sm text-gray-900 dark:text-gray-100">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">수동 공고 정보 확인/수정</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">결제 및 공고 상태를 확인하고 필요한 내용을 수정합니다.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isLoading ? '저장 중...' : '공고 내용 저장'}
                    </button>
                </header>
            )}

            <form onSubmit={handleSubmit} className={`space-y-8 ${isEmbedded ? 'mt-2' : ''}`}>
                {isEmbedded && (
                    <>
                        <style>{`
                            header, footer, aside, nav, .mobile-bottom-nav { display: none !important; }
                            main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                            body { background-color: #f9fafb !important; }
                        `}</style>
                        <div className="sticky top-0 z-50 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md p-4 px-6 -mx-4 -mt-4 mb-6 border-b border-gray-200 dark:border-dark-border flex justify-between items-center shadow-sm rounded-t-2xl">
                            <h2 className="text-[14px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                상세 정보 수정 모드
                            </h2>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-gray-900 dark:bg-amber-600 text-white px-6 py-2 rounded-xl font-black shadow-md hover:bg-black dark:hover:bg-amber-500 transition disabled:opacity-50 text-[13px]"
                            >
                                <Save size={14} />
                                {isLoading ? '저장...' : '공고 내용 저장'}
                            </button>
                        </div>
                    </>
                )}
                {/* 광고 등급 & 기한 관리 (Admin) */}
                <section className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-indigo-100 dark:border-dark-border shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-indigo-50 dark:border-dark-border pb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-black text-indigo-900 dark:text-indigo-400">👑 프리미엄 및 점프 관리 (관리자)</h2>
                            <button
                                type="button"
                                onClick={handleJumpSave}
                                disabled={isLoading}
                                className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[12px] font-black hover:bg-indigo-700 transition shadow-md shadow-indigo-100 disabled:opacity-50"
                            >
                                {isLoading ? '저장 중...' : '💾 점프 설정 저장'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm ${form.vvipExpiredAt && new Date(form.vvipExpiredAt) > new Date() ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-gray-100 text-gray-400'}`}>VVIP</span>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm ${form.vipExpiredAt && new Date(form.vipExpiredAt) > new Date() ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-gray-100 text-gray-400'}`}>VIP</span>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm ${form.normalExpiredAt && new Date(form.normalExpiredAt) > new Date() ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-400'}`}>일반</span>
                        </div>
                    </div>


                    <div className="grid grid-cols-1 gap-6">
                        {/* 1. 점프 설정 영역 */}
                        <div className="flex gap-4 p-4 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-black text-indigo-400 uppercase tracking-widest pl-1">남은 점프 횟수</label>
                                <div className="flex items-center gap-2 pr-4 bg-white dark:bg-dark-bg border border-indigo-100 dark:border-dark-border rounded-xl">
                                    <input type="number" name="remainingAutoJumps" value={form.remainingAutoJumps} onChange={handleChange} className="w-full p-3 bg-transparent border-none outline-none font-bold text-gray-700 dark:text-gray-300" />
                                    <span className="text-xs font-bold text-gray-400 whitespace-nowrap">회</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-black text-indigo-400 uppercase tracking-widest pl-1">자동 점프 간격 (분)</label>
                                <div className="flex bg-white dark:bg-dark-bg border border-indigo-100 dark:border-dark-border rounded-xl">
                                    <input type="number" name="autoJumpIntervalMin" value={form.autoJumpIntervalMin} onChange={handleChange} className="w-full p-3 bg-transparent border-none outline-none font-bold text-gray-700 dark:text-gray-300" />
                                    <span className="text-xs font-bold text-gray-400 whitespace-nowrap px-4 mt-3">분 마다</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. 유료 기간 관리 영역 (다중 조작) */}
                        <div className="space-y-4 pt-2">
                            <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 px-1 border-b border-gray-100 dark:border-dark-border pb-2">독립 노출 기간 설정 (폭포수 시스템)</h3>
                            
                            {(['vvip', 'vip', 'normal'] as const).map((tier) => {
                                const valStr = form[`${tier}ExpiredAt` as keyof typeof form] as string | null
                                const nameMap = { vvip: 'VVIP 프리미엄', vip: 'VIP 추천', normal: '일반 공고' }
                                const colorMap = { vvip: 'pink', vip: 'purple', normal: 'gray' }
                                const cStr = colorMap[tier]

                                return (
                                    <div key={tier} className={`flex items-center justify-between p-4 rounded-2xl border ${valStr ? `bg-${cStr}-50/30 dark:bg-${cStr}-900/10 border-${cStr}-200 dark:border-${cStr}-900/30` : 'bg-gray-50/50 dark:bg-dark-bg/50 border-gray-100 dark:border-dark-border'}`}>
                                        <div className="flex flex-col w-32">
                                            <span className={`text-xs font-black uppercase tracking-widest text-${cStr}-500`}>{nameMap[tier]}</span>
                                            {valStr ? (
                                                <div className="flex flex-col mt-0.5">
                                                    <span className="text-[15px] font-black text-gray-900 dark:text-gray-100 tracking-tight">{new Date(valStr).toISOString().split('T')[0]}</span>
                                                    {(() => {
                                                        const days = Math.ceil((new Date(valStr).getTime() - new Date().getTime()) / 86400000);
                                                        return <span className={`text-[11px] font-black -mt-0.5 ${days > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                            {days > 0 ? `${days}일 남음` : '만료됨'}
                                                        </span>
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-[13px] font-black text-gray-400 dark:text-gray-500 mt-1">기간 없음</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {/* + Buttons */}
                                            <div className="flex bg-blue-50/50 dark:bg-blue-900/20 rounded-xl shadow-sm overflow-hidden border border-blue-100 dark:border-blue-900/30">
                                                {[1, 30].map(d => (
                                                    <button key={d} type="button" 
                                                        onClick={() => {
                                                            const base = valStr ? new Date(valStr) : new Date()
                                                            base.setDate(base.getDate() + d)
                                                            setForm(f => ({ ...f, [`${tier}ExpiredAt`]: base.toISOString() }))
                                                        }}
                                                        className="px-3 md:px-4 py-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-r border-blue-100 dark:border-blue-900/30 last:border-0 transition"
                                                    >+{d}일</button>
                                                ))}
                                            </div>
                                            {/* - Buttons */}
                                            <div className="flex bg-rose-50/50 dark:bg-rose-900/20 rounded-xl shadow-sm overflow-hidden border border-rose-100 dark:border-rose-900/30">
                                                {[1, 30].map(d => (
                                                    <button key={d} type="button" 
                                                        onClick={() => {
                                                            if(!valStr) return
                                                            const base = new Date(valStr)
                                                            base.setDate(base.getDate() - d)
                                                            setForm(f => ({ ...f, [`${tier}ExpiredAt`]: base.toISOString() }))
                                                        }}
                                                        className="px-3 md:px-4 py-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border-r border-rose-100 dark:border-rose-900/30 last:border-0 transition"
                                                    >-{d}일</button>
                                                ))}
                                            </div>
                                            {/* Reset Button */}
                                            <button type="button" onClick={() => setForm(f => ({ ...f, [`${tier}ExpiredAt`]: null }))} className="px-3 rounded-xl ml-2 text-xs font-black bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-card transition">
                                                초기화
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
                
                {/* 실시간 미리보기 */}
                <section className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">실시간 카드 미리보기</h2>
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-dark-bg rounded-xl text-xs font-black cursor-pointer hover:bg-gray-800 transition">
                            <ImageIcon size={14} />
                            배너 이미지 업로드
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        setIsLoading(true)
                                        try {
                                            const urls = await handleFileUpload([file], 'banners')
                                            setForm(prev => ({ ...prev, bannerUrl: urls[0] }))
                                        } catch (err: any) {
                                            alert(err.message)
                                        } finally {
                                            setIsLoading(false)
                                        }
                                    }
                                }} 
                            />
                        </label>
                    </div>
                    
                    <div className="border border-gray-100 dark:border-dark-border rounded-3xl bg-white dark:bg-dark-bg p-5 flex gap-5 shadow-inner items-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl flex flex-col items-center justify-center flex-shrink-0 text-gray-300 relative overflow-hidden">
                            {logoFile || form.logoUrl ? (
                                <img src={logoFile ? URL.createObjectURL(logoFile) : form.logoUrl} className="w-full h-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <ImageIcon size={24} className="mb-1 opacity-50" strokeWidth={1.5} />
                                    <span className="text-[10px] font-bold">이미지 없음</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 text-[12px]">
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-pink-900/30 text-amber-600 font-bold text-[10px]">AD</span>
                                <span className="font-black text-gray-900 dark:text-gray-100">{form.businessName || '상호명 미입력'}</span>
                                <span className="text-gray-400">· {form.status === 'ACTIVE' ? '광고중' : '승인대기'}</span>
                            </div>
                            <div className="font-black text-lg text-gray-900 dark:text-gray-100 truncate mb-2">{form.title || '광고 제목을 입력해주세요'}</div>
                            <div className="text-[13px] text-gray-500 truncate space-x-2 flex items-center">
                                <span className="font-black text-gray-800 dark:text-gray-200">
                                    {form.salaryType === 'NEGOTIABLE' ? '급여협의' : `${getSalaryName(form.salaryType)} ${form.salaryAmount || '0'}만원`}
                                </span>
                                <span className="text-gray-200 dark:text-dark-border">|</span>
                                <span>{getRegionName(form.regionSlugs[0])}</span>
                                <span className="text-gray-200 dark:text-dark-border">|</span>
                                <span>{getCatName(form.categorySlug)}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight">Job NO: {form.jobNo}</span>
                                <span className="bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight">연락처: {form.contactInfo}</span>
                                {form.remainingAutoJumps > 0 && (
                                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight">남은 점프: {form.remainingAutoJumps}회</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 사업자 정보 섹션 (관리자 전용) */}
                <section className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-dark-border pb-4">사업자 정보 (관리자 전용)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">상호명 (전용 커스텀)</label>
                            <input name="officialBusinessName" value={form.officialBusinessName} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 transition" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">대표자명</label>
                            <input name="businessOwnerName" value={form.businessOwnerName} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 transition" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">사업장 주소</label>
                            <input name="businessAddress" value={form.businessAddress} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 transition" />
                        </div>
                    </div>
                    {form.bannerUrl && (
                        <div className="mt-4 space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">현재 배너 미리보기</label>
                            <div className="relative group rounded-2xl overflow-hidden aspect-[4/1] bg-gray-100 border border-gray-100 dark:border-dark-border">
                                <img src={form.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                                <button type="button" onClick={() => setForm(f => ({ ...f, bannerUrl: '' }))} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* 기본 정보 */}
                <section className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-dark-border pb-4">기본 정보</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">공고 제목</label>
                            <input name="title" value={form.title} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">상호명 (광고주 표기)</label>
                            <input name="businessName" value={form.businessName} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition" placeholder="예: 악녀대표실장" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">담당자 닉네임</label>
                            <input name="managerName" value={form.managerName} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">연락처</label>
                            <input name="contactInfo" value={form.contactInfo} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">고용 형태</label>
                            <div className="relative">
                                <select name="workingType" value={form.workingType} onChange={handleChange} className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 appearance-none focus:ring-2 focus:ring-amber-500 transition">
                                    <option value="고용">고용</option>
                                    <option value="파트타임">파트타임</option>
                                    <option value="단기">단기</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 급여 및 카테고리 */}
                <section className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-dark-border pb-4">급여 및 카테고리</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">직종 선택</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_OPTIONS.map(c => (
                                    <button key={c.slug} type="button" onClick={() => setForm(prev => ({ ...prev, categorySlug: c.slug }))}
                                        className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${form.categorySlug === c.slug ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-dark-bg text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-border hover:border-indigo-300'}`}
                                    > {c.name} </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">급여 정보</label>
                            <div className="flex bg-gray-50 dark:bg-dark-bg rounded-2xl overflow-hidden p-1 border border-gray-100 dark:border-dark-border">
                                <select name="salaryType" value={form.salaryType} onChange={handleChange} className="bg-white dark:bg-dark-card px-4 py-3 rounded-xl font-bold text-sm outline-none border-none shadow-sm min-w-[100px] text-gray-900 dark:text-gray-100">
                                    {SALARY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <div className="flex-1 flex items-center px-4 gap-2">
                                    <input type="number" name="salaryAmount" value={form.salaryAmount} onChange={handleChange} placeholder="금액" className="flex-1 bg-transparent border-none outline-none font-black text-right text-gray-900 dark:text-gray-100" disabled={form.salaryType === 'NEGOTIABLE'} />
                                    <span className="text-sm font-black text-gray-400">만원</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 지역 선택 */}
                <section className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-dark-border pb-4 flex items-center gap-2">
                        지역 선택
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">(최대 3개)</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metadata.regions.map(p => (
                            <div key={p.id} className="p-4 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-dark-border">
                                <p className="text-[11px] font-black text-amber-500 mb-3 uppercase tracking-tighter">{p.name}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {p.children.map((c: any) => (
                                        <button key={c.slug} type="button" onClick={() => toggleRegion(c.slug)}
                                            className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-all border ${form.regionSlugs.includes(c.slug) ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100 dark:shadow-none' : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border-gray-100 dark:border-dark-border hover:border-amber-200'}`}
                                        > {c.name} </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 상세 설명 */}
                <section className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-dark-border pb-4 flex items-center gap-2">상세 설명 <span className="text-[13px] font-normal text-gray-400 dark:text-gray-500">(모바일 최적화 규격 및 편집기 적용)</span></h2>
                    
                    <div className="max-w-[400px] mx-auto w-full border border-gray-100 dark:border-dark-border rounded-2xl overflow-hidden">
                        <div className="bg-gray-50 dark:bg-dark-bg p-2 flex items-center gap-1 flex-wrap border-b border-gray-100 dark:border-dark-border">
                            <div className="flex items-center gap-1 border-r border-gray-200 dark:border-dark-border pr-2 mr-1">
                                <select 
                                    onChange={(e) => {
                                        execCommand('formatBlock', e.target.value)
                                        editorRef.current?.focus()
                                    }}
                                    className="bg-transparent text-gray-800 dark:text-gray-100 text-[14px] px-2 font-bold outline-none cursor-pointer"
                                >
                                    <option value="p" className="text-[14px]">일반</option>
                                    <option value="h1" className="text-[24px] font-bold">큰 글자</option>
                                </select>
                            </div>
                            <ToolbarBtn onClick={() => execCommand('bold')} icon={<Bold size={16} />} />
                            <ToolbarBtn onClick={() => execCommand('underline')} icon={<Underline size={16} />} />
                            <ToolbarBtn onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16} />} />
                            <ToolbarBtn onClick={() => execCommand('justifyCenter')} icon={<ImageIcon size={16} className="rotate-90" />} /> {/* Using image/align icons as needed */}
                            <label className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-card rounded-lg cursor-pointer ml-auto">
                                <ImageIcon size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={insertImageToEditor} />
                            </label>
                        </div>
                        <div 
                            ref={editorRef} 
                            contentEditable 
                            suppressHydrationWarning={true}
                            className="p-8 min-h-[400px] outline-none leading-relaxed text-[15px] job-description-content dark:[&_*]:text-gray-100 break-all whitespace-pre-wrap text-center [&_p]:mb-3 [&_*]:max-w-full [&_*]:break-all! [&_*]:whitespace-pre-wrap!"
                            onInput={(e) => {
                                const content = e.currentTarget.innerHTML
                                setForm(prev => ({ ...prev, description: content }))
                            }}
                        />
                    </div>
                </section>

                <div className="flex justify-center pt-10">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center gap-3 bg-gray-900 dark:bg-amber-600 text-white w-full max-w-[400px] py-5 rounded-3xl font-black shadow-2xl shadow-gray-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 text-lg"
                    >
                        <Save size={22} />
                        {isLoading ? '수정 사항 저장 중...' : '전체 공고 내용 저장하기'}
                    </button>
                </div>
            </form>
        </div>
    )
}

function ToolbarBtn({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} onMouseDown={e => e.preventDefault()} className="p-2 text-gray-500 hover:bg-white hover:text-amber-500 hover:shadow-sm rounded-lg transition"> {icon} </button>
    )
}
