'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, ChevronDown, Bold, Type, Palette, AlignLeft, AlignCenter, AlignRight, List, Underline, Strikethrough, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import RegionPicker from '@/components/ui/RegionPicker'

const CATEGORY_OPTIONS = [
    { name: '룸', slug: 'room' },
    { name: '노래주점', slug: 'karaoke' },
    { name: '텐프로/쩜오', slug: 'tenpro' },
    { name: '바/카페', slug: 'bar' },
    { name: '아로마', slug: 'aroma' },
    { name: '기타', slug: 'etc' },
]

const SALARY_TYPES = [
    { value: 'TC', label: '티씨 (T/C)' },
    { value: 'HOURLY', label: '시급' },
    { value: 'NEGOTIABLE', label: '협의' },
]

export default function NewJobPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [metadata, setMetadata] = useState<{ regions: any[] }>({ regions: [] })
    const editorRef = useRef<HTMLDivElement>(null)
    const initializedRef = useRef(false)

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
        businessName: '', // 상호명
        kakaoId: '',
        telegramId: '',
        lineId: '',
        logoUrl: '',
        imageUrls: [] as string[],
        workingType: '고용',
    })

    const [logoFile, setLogoFile] = useState<File | null>(null)

    const [hasEmployerInfo, setHasEmployerInfo] = useState(false)

    useEffect(() => {
        const fetchMetadataAndCheckAuth = async () => {
            try {
                // Check if Employer is registered for redirect logic later
                const empRes = await fetch('/api/employer/me')
                if (empRes.ok) {
                    setHasEmployerInfo(true)
                }

                // Load metadata
                const res = await fetch('/api/common/metadata')
                if (res.ok) {
                    const data = await res.json()
                    setMetadata({ regions: data.regions })
                }
            } catch (err) { console.error(err) }
        }
        fetchMetadataAndCheckAuth()
    }, [])

    // Initialize editor content once
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
        const { optimizeImage } = await import('@/lib/image-optimizer')
        const supabase = createClient()
        const urls = []
        for (const file of files) {
            // 이미지 최적화 (WebP 변환 및 리사이징)
            const optimizedFile = await optimizeImage(file)

            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.webp`
            const filePath = `${bucket}/${fileName}`
            const { error } = await supabase.storage.from(bucket).upload(filePath, optimizedFile)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.contactInfo || form.regionSlugs.length === 0) {
            alert('제목, 지역, 연락처는 필수입니다.')
            return
        }

        const forbiddenWords = ['실장', '팀장', '사장', '담당', '마담', '대표', '전무', '상무', '이사'];
        const hasManagerForbiddenWord = forbiddenWords.some(word => form.managerName.includes(word));
        if (hasManagerForbiddenWord) {
            alert('담당자 이름에는 직급/호칭을 넣을 수 없습니다. (실명 입력 권장: 홍길동 O / 박실장 X)');
            return;
        }

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

            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    description: finalDescription,
                    logoUrl: finalLogoUrl,
                    salaryInfo: salaryInfoValue,
                    salaryAmount: Number(form.salaryAmount) || 0,
                    ageMin: Number(form.ageMin) || 20,
                    ageMax: form.ageMax ? Number(form.ageMax) : null,
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || '등록 실패');
            }
            const resData = await res.json();

            if (!hasEmployerInfo) {
                alert('공고가 성공적으로 임시 등록되었습니다!\n정상 노출을 위해서는 사업자 정보 등록이 꼭 필요합니다.\n사업자 등록 페이지로 이동합니다.')
                router.push(`/employer/business?nextJobId=${resData.data.id}`)
            } else {
                alert('공고가 성공적으로 등록되었습니다!\n결제 페이지로 이동합니다.')
                router.push(`/employer/jobs/${resData.data.id}/payment`)
            }
        } catch (error: any) { alert('오류: ' + error.message) }
        finally { setIsLoading(false) }
    }

    // Helper for region name
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
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-dark-bg text-gray-800 dark:text-gray-100 font-sans pb-32">
            <header className="flex items-center justify-between h-[56px] px-4 bg-white dark:bg-dark-card sticky top-0 z-50 shadow-sm border-b dark:border-dark-border relative">
                <button type="button" onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition z-10 relative cursor-pointer">
                    <ArrowLeft size={22} />
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 font-bold text-[16px] text-gray-900 dark:text-gray-100">광고등록</h1>
                <div className="w-[38px]"></div>
            </header>

            <div className="bg-[#fcfdff] dark:bg-dark-bg py-5 px-4 text-center border-b border-gray-100 dark:border-dark-border flex flex-col items-center justify-center">
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-[1.6]">
                    엘프알바에서 성매매와 관련된 광고를 할 경우,<br />
                    서비스 이용이 제한되며 법적 처벌을 받을 수 있어요.<br />
                    <Link href="/support/policy" className="text-blue-500 font-bold mt-1 inline-block">자세히 보기</Link>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white dark:bg-dark-card min-h-screen border-x border-gray-50 dark:border-dark-border">
                <div className="p-5 space-y-6">

                    {/* 미리보기 section */}
                    <section>
                        <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-4">미리보기</h2>
                        <div className="border border-gray-100 dark:border-dark-border rounded-[12px] bg-white dark:bg-dark-card p-4 flex gap-4 shadow-sm dark:shadow-none items-center">
                            <div className="w-[70px] h-[70px] bg-[#f8f9fa] dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-[10px] flex flex-col items-center justify-center flex-shrink-0 text-gray-300 dark:text-gray-700">
                                {logoFile || form.logoUrl ? (
                                    <img src={logoFile ? URL.createObjectURL(logoFile) : form.logoUrl} className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <ImageIcon size={22} className="mb-1" strokeWidth={1.5} />
                                        <span className="text-[10px] font-medium leading-tight">이미지<br />준비중</span>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1 text-[12px]">
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{form.businessName || '공고상호명'}</span>
                                    <span className="text-gray-400 dark:text-gray-600">· n일째 광고중</span>
                                </div>
                                <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100 truncate mb-1.5">{form.title || '광고 제목'}</div>
                                <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate space-x-1.5 flex items-center">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">
                                        {form.salaryType === 'NEGOTIABLE' ? '협의' : `${getSalaryName(form.salaryType)} ${form.salaryAmount || '0'}만원`}
                                    </span>
                                    <span>·</span>
                                    <span>{getRegionName(form.regionSlugs[0])}</span>
                                    <span>·</span>
                                    <span>{getCatName(form.categorySlug)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 채용정보 section */}
                    <section>
                        <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-4">채용정보</h2>
                        <div className="space-y-4">
                            {/* Business Name as Nickname/Title (Filtered by title field) */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1">제목</label>
                                <input name="title" value={form.title} onChange={handleChange}
                                    placeholder="제목을 입력해주세요"
                                    className="ui-input w-full dark:bg-dark-bg dark:border-dark-border dark:text-gray-100" required />
                            </div>

                            {/* Job Specific Business Name */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1">공고상호명</label>
                                <input name="businessName" value={form.businessName} onChange={handleChange}
                                    placeholder="공고상호명 (엘프대표, 엘프1등실장 등)"
                                    className="ui-input w-full dark:bg-dark-bg dark:border-dark-border dark:text-gray-100" required />
                            </div>

                            {/* Manager & Contact */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    담당자실명 연락처
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-[30%] flex-shrink-0">
                                        <input name="managerName" value={form.managerName} onChange={handleChange}
                                            placeholder="담당자실명"
                                            className="ui-input w-full dark:bg-dark-bg dark:border-dark-border dark:text-gray-100" />
                                    </div>
                                    <div className="w-[70%]">
                                        <input name="contactInfo" value={form.contactInfo} onChange={handleChange}
                                            placeholder="010-8888-8888"
                                            className="ui-input w-full dark:bg-dark-bg dark:border-dark-border dark:text-gray-100" required />
                                    </div>
                                </div>
                                <p className="text-gray-400 dark:text-gray-600 text-[11px] mt-1.5 leading-relaxed">
                                    실제 공고의 '전화하기' 버튼에 연결되는 정보입니다. 가입 시 인증된 번호와 달라두 됩니다.
                                </p>
                            </div>


                            {/* Regions – Picker */}
                            <div>
                                <div className="text-[14px] font-black text-gray-900 dark:text-gray-100 mb-3 border-b-2 border-gray-900 dark:border-gray-100 pb-2 flex items-center gap-2">
                                    <span>지역 선택</span>
                                    <span className="text-gray-400 dark:text-gray-600 font-normal text-[12px]">(최대 3개)</span>
                                </div>
                                <RegionPicker
                                    regions={metadata.regions}
                                    value={form.regionSlugs}
                                    onChange={(slugs) => setForm(prev => ({ ...prev, regionSlugs: slugs }))}
                                />
                            </div>

                            {/* Category List (Clickable Buttons) */}
                            <div>
                                <div className="text-[14px] font-black text-gray-900 dark:text-gray-100 mb-3 border-b-2 border-gray-900 dark:border-gray-100 pb-2 mt-6">직종 선택</div>
                                <div className="grid grid-cols-3 gap-3">
                                    {CATEGORY_OPTIONS.map(c => (
                                        <button
                                            key={c.slug}
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, categorySlug: c.slug }))}
                                            className={`h-16 rounded-[16px] text-[15px] font-black transition-all border flex items-center justify-center ${form.categorySlug === c.slug
                                                ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-100 dark:shadow-none'
                                                : 'bg-white dark:bg-dark-bg text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-900/50'
                                                }`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Salary */}
                            <div className="mt-6">
                                <div className="text-[14px] font-black text-gray-900 dark:text-gray-100 mb-3 border-b-2 border-gray-900 dark:border-gray-100 pb-2">급여</div>
                                <div className="flex bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-[12px] overflow-hidden">
                                    <div className="relative w-1/2 border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50 flex items-center">
                                        <div className="pl-4 text-[14px] text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">분류</div>
                                        <select name="salaryType" value={form.salaryType} onChange={handleChange} className="w-full h-14 pl-4 pr-10 appearance-none bg-transparent cursor-pointer font-bold text-[15px] outline-none text-center text-gray-900 dark:text-gray-100">
                                            {SALARY_TYPES.map(t => <option key={t.value} value={t.value} className="dark:bg-dark-card">{t.label}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                                    </div>
                                    <div className={`relative w-1/2 flex items-center ${form.salaryType === 'NEGOTIABLE' ? 'opacity-30 pointer-events-none' : ''}`}>
                                        <div className="pl-4 text-[14px] text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap z-10">금액</div>
                                        <input
                                            type="number"
                                            name="salaryAmount"
                                            value={form.salaryType === 'NEGOTIABLE' ? '' : form.salaryAmount}
                                            onChange={handleChange}
                                            placeholder={form.salaryType === 'NEGOTIABLE' ? '협의' : '30'}
                                            className="w-full h-14 bg-transparent outline-none pl-4 pr-[50px] font-black text-[16px] text-center text-gray-900 dark:text-gray-100"
                                            disabled={form.salaryType === 'NEGOTIABLE'}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-800 dark:text-gray-200 pointer-events-none">만원</span>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </section>

                    {/* 상세정보 section */}
                    <section>
                        <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">상세정보 <span className="text-[13px] font-normal text-gray-500 dark:text-gray-300">(모바일 최적화 규격 적용 - 보이는 그대로 등록됩니다)</span></h2>
                        <div className="space-y-4">
                            {/* Removed title input from here as it's moved to the top */}

                            <div className="max-w-[400px] mx-auto w-full border border-gray-200 dark:border-dark-border rounded-[12px] overflow-hidden">
                                <div className="bg-[#f8f9fa] dark:bg-dark-bg flex items-center gap-1 p-2 border-b border-gray-200 dark:border-dark-border flex-wrap">
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
                                    <ToolbarBtn onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16} />} />
                                    <ToolbarBtn onClick={() => execCommand('justifyCenter')} icon={<AlignCenter size={16} />} />
                                    <ToolbarBtn onClick={() => execCommand('justifyRight')} icon={<AlignRight size={16} />} />
                                    <ToolbarBtn onClick={() => execCommand('bold')} icon={<Bold size={16} />} />

                                    <label onMouseDown={e => e.preventDefault()} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-bg rounded-md transition cursor-pointer ml-auto bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
                                        <ImageIcon size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={insertImageToEditor} />
                                    </label>
                                </div>
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressHydrationWarning={true}
                                    onInput={(e) => {
                                        const content = e.currentTarget.innerHTML
                                        setForm(prev => ({ ...prev, description: content }))
                                    }}
                                    className="p-5 min-h-[400px] outline-none text-[15px] leading-[1.9] text-gray-800 dark:text-gray-100 text-center break-keep job-description-content dark:[&_*]:text-gray-100 [&_p]:mb-3"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 대표이미지 section */}
                    <section>
                        <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-4">대표이미지</h2>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                <label className="w-[84px] h-[84px] bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-[12px] flex items-center justify-center text-gray-400 dark:text-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card transition">
                                    <Plus size={24} strokeWidth={1.5} />
                                    <input id="logo-upload-input" type="file" className="hidden" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                                </label>
                                {(logoFile || form.logoUrl) && (
                                    <div className="w-[84px] h-[84px] rounded-[12px] overflow-hidden border border-gray-200 dark:border-dark-border relative">
                                        <img src={logoFile ? URL.createObjectURL(logoFile) : form.logoUrl} className="w-full h-full object-contain" />
                                        <button type="button" onClick={() => { setLogoFile(null); setForm(prev => ({ ...prev, logoUrl: '' })) }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X size={12} /></button>
                                    </div>
                                )}
                            </div>
                            <ul className="text-[12px] text-gray-500 dark:text-gray-400 space-y-[2px] leading-relaxed">
                                <li>· 이미지 권장 사이즈: 가로 600px, 세로 600px (1:1 비율)</li>
                                <li>· 대표 이미지가 없다면, 광고 결제 후 엘프알바에서 제작해드려요.</li>
                                <li>· 움직이는 이미지는 등록할 수 없어요.</li>
                            </ul>
                        </div>
                    </section>



                </div>

                {/* Footer Submit */}
                <div className="bg-[#f8f9fa] dark:bg-dark-bg p-5 border-t border-gray-100 dark:border-dark-border mt-4 pb-[80px]">
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 text-center mb-4">
                        엘프알바 광고관리 규정에 위배되는 내용을 입력할 경우,<br />
                        별도 안내 없이 수정되거나 반려될 수 있어요.
                    </p>
                    <button type="submit" disabled={isLoading}
                        className="w-full h-14 bg-amber-500 text-white font-bold rounded-[12px] text-[15px] hover:bg-amber-600 transition-all shadow-xl shadow-amber-100 dark:shadow-none active:scale-[0.98] disabled:opacity-50">
                        {isLoading ? '등록 중...' : '등록하기'}
                    </button>
                </div>
            </form>

            <style jsx global>{`
                .ui-input {
                    background: #ffffff;
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    padding: 13px 16px;
                    font-size: 14.5px;
                    color: #495057;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .dark .ui-input {
                    background: #111111;
                    border-color: #333333;
                    color: #eeeeee;
                }
                .ui-input:focus {
                    border-color: #adb5bd;
                }
                .dark .ui-input:focus {
                    border-color: #555555;
                }
                .ui-input::placeholder {
                    color: #adb5bd;
                }
                .dark .ui-input::placeholder {
                    color: #555555;
                }
                .job-description-content::selection {
                    background: #ff71a2; /* 바달바 핑크톤 */
                    color: white;
                }
                .job-description-content *::selection {
                    background: #ff71a2;
                    color: white;
                }
                .job-description-content h1 { font-size: 28px; font-weight: 800; margin-bottom: 16px; line-height: 1.3; }
                .job-description-content h2 { font-size: 22px; font-weight: 700; margin-bottom: 12px; line-height: 1.4; }
                .job-description-content h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; line-height: 1.5; }
                .job-description-content p { margin-bottom: 12px; }
                .dark select option {
                    background-color: #1a1a1a;
                    color: white;
                }
            `}</style>
        </div>
    )
}

function ToolbarBtn({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} onMouseDown={e => e.preventDefault()} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-card rounded-md transition">
            {icon}
        </button>
    )
}
