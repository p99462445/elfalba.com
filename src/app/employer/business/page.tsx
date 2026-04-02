'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Search } from 'lucide-react'

export default function BusinessRegistrationPage() {
    const [formData, setFormData] = useState({
        businessNumber: '',
        businessName: '',
        representativeName: '',
        address: '',
        detailedAddress: '',
    })

    const [verificationStatus, setVerificationStatus] = useState<'NONE' | 'SUCCESS' | 'ERROR'>('NONE')
    const [invoiceType, setInvoiceType] = useState<'CASH_RECEIPT' | 'TAX_INVOICE'>('CASH_RECEIPT')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Daum Postcode Script Loading
    useEffect(() => {
        const script = document.createElement('script')
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
        script.async = true
        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, [])

    // 국세청 OPEN API 사업자 상태조회 연동 함수
    const verifyBusinessNumber = async () => {
        const cleanNumber = formData.businessNumber.replace(/-/g, '')
        if (cleanNumber.length !== 10) {
            setVerificationStatus('ERROR')
            alert('사업자등록번호 10자리를 정확히 입력해주세요.')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/employer/verify-business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessNumber: cleanNumber })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.isValid) {
                    setVerificationStatus('SUCCESS')
                    alert('사업자 상태가 정상(계속사업자)으로 확인되었습니다.')
                } else {
                    setVerificationStatus('ERROR')
                    alert(data.message || '유효하지 않거나 폐업된 사업자입니다.')
                }
            } else {
                setVerificationStatus('ERROR')
                alert('국세청 서버 장애 또는 오류가 발생했습니다. 잠시 후 시도해주세요.')
            }
        } catch (error) {
            setVerificationStatus('ERROR')
            alert('조회 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Daum 우편번호 서비스(주소검색) 핸들러
    const openAddressSearch = () => {
        if (!(window as any).daum || !(window as any).daum.Postcode) {
            alert("주소 서비스 로딩 중입니다. 잠시만 기다려주세요.")
            return
        }

        new (window as any).daum.Postcode({
            oncomplete: function (data: any) {
                let fullAddress = data.address;
                let extraAddress = '';

                if (data.addressType === 'R') {
                    if (data.bname !== '') extraAddress += data.bname;
                    if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
                    fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
                }

                setFormData(prev => ({ ...prev, address: fullAddress }))
            }
        }).open();
    }

    // Fetch existing data
    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const res = await fetch('/api/employer/me')
                if (res.ok) {
                    const data = await res.json()
                    if (data.employer) {
                        const rawAddress = data.employer.address || ""
                        const addrParts = rawAddress ? rawAddress.split(' ') : []
                        const detailed = addrParts.length > 0 ? addrParts.pop() || '' : ''
                        const basic = addrParts.join(' ')

                        setFormData({
                            businessNumber: data.employer.business_number || '',
                            businessName: data.employer.business_name || '',
                            representativeName: data.employer.owner_name || '',
                            address: basic || '',
                            detailedAddress: detailed || ''
                        })
                        setVerificationStatus('SUCCESS')
                    }
                }
            } catch (err) {
                console.error("Failed to fetch existing employer data", err)
            }
        }
        fetchExisting()
    }, [])

    const [certFile, setCertFile] = useState<File | null>(null)
    const [certUrl, setCertUrl] = useState('')

    const handleFileUpload = async (file: File) => {
        const { createClient } = await import('@/lib/supabase/client')
        const { optimizeImage } = await import('@/lib/image-optimizer')
        const supabase = createClient()

        // 이미지 최적화 (WebP 변환 및 리사이징)
        const optimizedFile = await optimizeImage(file)

        const fileName = `cert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`
        const { data, error } = await supabase.storage.from('business-certs').upload(fileName, optimizedFile)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('business-certs').getPublicUrl(fileName)
        return publicUrl
    }

    const submitEmployerData = async () => {
        if (verificationStatus !== 'SUCCESS') {
            alert("사업자 번호 인증이 필요합니다.")
            return
        }
        setIsLoading(true)

        try {
            let finalCertUrl = certUrl
            if (certFile) {
                finalCertUrl = await handleFileUpload(certFile)
            }

            const res = await fetch('/api/employer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, invoiceType, businessCertUrl: finalCertUrl })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to register employer')
            }

            alert("사업자 정보가 성공적으로 등록 되었습니다! 관리 화면으로 이동합니다.")

            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
            const nextJobId = urlParams?.get('nextJobId')

            if (nextJobId) {
                window.location.href = `/employer/jobs/${nextJobId}/payment`
            } else {
                window.location.href = '/employer'
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 pb-24 font-sans">
            {/* Header */}
            <header className="flex items-center p-6 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card sticky top-0 z-[100]">
                <Link href="/mypage" className="text-gray-400 dark:text-gray-600 hover:text-amber-500 transition mr-4">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 flex-1 text-center pr-10 tracking-tighter">사업자정보 등록</h1>
            </header>

            {/* Top Warning Banner */}
            <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/50">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                    엘프알바 광고관리 규정에 위배되는 내용을 입력할 경우,<br />
                    서비스 이용이 제한되며 법적 처벌을 받을 수 있어요.
                </p>
                <Link href="/elfalba-고객센터" className="text-amber-400 dark:text-amber-500 text-xs font-black mt-2 inline-block underline">운영정책 자세히 보기</Link>
            </div>

            <div className="max-w-xl mx-auto p-6 space-y-10">

                {/* 사업자등록증 이미지 */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-[#fb969a] rounded-full"></div>
                        <h2 className="text-base font-black text-gray-800 dark:text-gray-100">사업자등록증 첨부</h2>
                    </div>
                    <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg rounded-[30px] transition hover:bg-amber-50/30 dark:hover:bg-amber-950/10 hover:border-amber-200 dark:hover:border-amber-900/50 group cursor-pointer overflow-hidden relative min-h-[200px]">
                        {certFile || certUrl ? (
                            <img src={certFile ? URL.createObjectURL(certFile) : certUrl} className="absolute inset-0 w-full h-full object-contain p-4" alt="Certificate" />
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-white dark:bg-dark-card rounded-2xl shadow-sm dark:shadow-none flex items-center justify-center text-gray-300 dark:text-gray-700 group-hover:text-amber-400 mb-4 transition">
                                    <Plus size={32} />
                                </div>
                                <span className="text-sm font-bold text-gray-400 dark:text-gray-600 group-hover:text-amber-500">사업자등록증 이미지 선택</span>
                            </>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={e => setCertFile(e.target.files?.[0] || null)}
                        />
                    </label>
                    <ul className="text-[11px] text-gray-400 dark:text-gray-600 mt-4 space-y-1.5 font-medium pl-1">
                        <li>· 이미지 파일(JPG, PNG)만 업로드 가능합니다.</li>
                        <li>· 사업자등록증에 가려지는 부분이 없어야해요.</li>
                        <li>· 이미지에 왜곡이나 흐린 부분이 있는지 확인해주세요.</li>
                    </ul>
                </section>

                {/* 사업자 상세정보 */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-[#fb969a] rounded-full"></div>
                        <h2 className="text-base font-black text-gray-800 dark:text-gray-100">사업자 상세정보</h2>
                    </div>

                    <div className="space-y-5">
                        {/* 사업자 번호 */}
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 pl-1">사업자등록번호</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="사업자번호 (숫자만 입력)"
                                    value={formData.businessNumber}
                                    onChange={e => {
                                        setFormData({ ...formData, businessNumber: e.target.value })
                                        setVerificationStatus('NONE')
                                    }}
                                    className="flex-1 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-4 text-sm font-bold focus:border-amber-300 dark:focus:border-amber-900/50 focus:bg-white dark:focus:bg-dark-card outline-none transition text-gray-900 dark:text-gray-100"
                                />
                                <button
                                    onClick={verifyBusinessNumber}
                                    disabled={isLoading}
                                    className="bg-amber-500 text-white px-8 rounded-2xl text-[13px] font-black hover:bg-amber-600 transition active:scale-95 shadow-lg shadow-amber-100 dark:shadow-none whitespace-nowrap"
                                >
                                    {isLoading ? '조회중' : '인증하기'}
                                </button>
                            </div>

                            {/* Notice Texts */}
                            <div className="bg-gray-50 dark:bg-dark-bg rounded-2xl p-4 space-y-1 border border-gray-100 dark:border-dark-border">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">※ 사업자등록번호 도용방지를 위해 기업인증을 시행하고 있습니다.</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">※ 인증이 되지 않을 경우 010-9946-2445 (유선)으로 문의해 주세요.</p>
                            </div>

                            {verificationStatus === 'SUCCESS' && (
                                <p className="text-green-500 text-[12px] font-black mt-2 pl-1">✅ 정상 확인되었습니다.</p>
                            )}
                            {verificationStatus === 'ERROR' && (
                                <p className="text-red-500 text-[12px] font-black mt-2 pl-1">❌ 다시 확인해 주십시오.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 pl-1">사업자명 (상호명)</label>
                            <input
                                type="text"
                                placeholder="사업자 상호를 입력해주세요."
                                value={formData.businessName}
                                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-4 text-sm font-bold focus:border-amber-300 dark:focus:border-amber-900/50 focus:bg-white dark:focus:bg-dark-card outline-none transition text-gray-900 dark:text-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 pl-1">대표자명</label>
                            <input
                                type="text"
                                placeholder="사업자 대표를 입력해주세요."
                                value={formData.representativeName}
                                onChange={e => setFormData({ ...formData, representativeName: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-4 text-sm font-bold focus:border-amber-300 dark:focus:border-amber-900/50 focus:bg-white dark:focus:bg-dark-card outline-none transition text-gray-900 dark:text-gray-100"
                            />
                        </div>

                        {/* 주소 검색 */}
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 pl-1">사업장 주소</label>
                            <div className="relative cursor-pointer mb-2" onClick={openAddressSearch}>
                                <input
                                    type="text"
                                    placeholder="사업자 주소를 검색해주세요."
                                    value={formData.address}
                                    readOnly
                                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-4 text-sm font-bold focus:border-amber-300 dark:focus:border-amber-900/50 focus:bg-white dark:focus:bg-dark-card outline-none cursor-pointer transition text-gray-900 dark:text-gray-100"
                                />
                                <div className="absolute right-4 top-4 text-gray-300 dark:text-gray-700 pointer-events-none group-hover:text-amber-400">
                                    <Search size={20} />
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="상세 주소를 입력해주세요."
                                value={formData.detailedAddress}
                                onChange={e => setFormData({ ...formData, detailedAddress: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-4 text-sm font-bold focus:border-amber-300 dark:focus:border-amber-900/50 focus:bg-white dark:focus:bg-dark-card outline-none transition text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border p-6 z-50">
                <div className="max-w-xl mx-auto">
                    <button
                        onClick={submitEmployerData}
                        disabled={verificationStatus !== 'SUCCESS' || !formData.businessName || isLoading}
                        className={`w-full h-16 font-black rounded-[25px] transition-all text-lg shadow-xl ${(verificationStatus === 'SUCCESS' && formData.businessName && !isLoading) ? 'bg-amber-500 text-white shadow-amber-200 dark:shadow-none hover:scale-[1.02] active:scale-95' : 'bg-gray-100 dark:bg-dark-bg text-gray-300 dark:text-gray-700 cursor-not-allowed'}`}
                    >
                        {isLoading ? '저장 중...' : '사업자 정보 등록완료'}
                    </button>
                </div>
            </div>
        </div>
    )
}
