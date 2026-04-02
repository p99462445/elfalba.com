'use client'
import React, { useEffect, useState } from 'react'
import * as PortOne from "@portone/browser-sdk/v2";
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles, CreditCard, Zap, Rocket, Crown, Star, ChevronRight, Copy, Check, Briefcase, Clock, Building2, CreditCard as CardIcon } from 'lucide-react'
import Script from 'next/script'

export default function JobPaymentPage() {
    const { id } = useParams()
    const router = useRouter()

    // Core data
    const [job, setJob] = useState<any>(null)
    const [products, setProducts] = useState<any[]>([])
    const [pendingPayment, setPendingPayment] = useState<any>(null)
    const [siteConfig, setSiteConfig] = useState<any>(null)

    // UI state
    const [loading, setLoading] = useState(true)
    const [selectedDays, setSelectedDays] = useState(30)
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [depositorName, setDepositorName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [showNameError, setShowNameError] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CARD'>('CARD')
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }, [])

    const isPopup = false;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobRes, prodRes, cfgRes] = await Promise.all([
                    fetch(`/api/jobs/${id}`),
                    fetch('/api/employer/products'),
                    fetch('/api/common/site-config')
                ])

                if (jobRes.ok) {
                    const jobData = await jobRes.json()
                    setJob(jobData)
                    // Check for pending payment
                    if (jobData.payments && jobData.payments.length > 0 && jobData.payments[0].status === 'PENDING') {
                        setPendingPayment(jobData.payments[0])
                    }
                }
                if (prodRes.ok) setProducts(await prodRes.json())
                if (cfgRes.ok) setSiteConfig(await cfgRes.json())
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    // Auto-select first VVIP product if no product selected
    useEffect(() => {
        if (!selectedProductId && products.length > 0 && !pendingPayment) {
            const defaultProd = products.find(p => p.product_type === 'VVIP_SLOT' && p.duration_days === selectedDays)
            if (defaultProd) setSelectedProductId(defaultProd.id)
        }
    }, [products, selectedDays, pendingPayment])

    // Sync selectedProductId when selectedDays changes
    useEffect(() => {
        if (!selectedProductId || products.length === 0 || pendingPayment) return

        const currentProduct = products.find(p => p.id === selectedProductId)
        if (currentProduct && currentProduct.duration_days !== selectedDays) {
            const matchingProduct = products.find(p =>
                p.product_type === currentProduct.product_type &&
                p.duration_days === selectedDays
            )
            if (matchingProduct) {
                setSelectedProductId(matchingProduct.id)
            }
        }
    }, [selectedDays, products, pendingPayment])

    const handlePortOnePayment = async () => {
        if (!selectedProductId || !job) return
        
        setIsSubmitting(true)
        try {
            const product = products.find(p => p.id === selectedProductId)
            if (!product) return

            const portoneStoreId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
            const portoneChannelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

            if (!portoneStoreId || !portoneChannelKey) {
                alert("결제 설정(Store ID 또는 Channel Key)이 누락되었습니다. .env 설정을 확인해주세요.");
                return;
            }
            
            // PortOne SDK V2 호출
            const response = await PortOne.requestPayment({
                storeId: portoneStoreId,
                channelKey: portoneChannelKey,
                paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                orderName: product.name,
                totalAmount: product.price,
                currency: "KRW",
                payMethod: "CARD",
                customer: {
                    customerId: job.employer?.id?.slice(0, 20) || "guest_user", // 갤럭시아 필수
                    fullName: job.employer?.name || "사용자",
                    phoneNumber: job.employer?.phone || "010-0000-0000",
                    email: (job.employer?.email && job.employer.email.includes('@')) ? job.employer.email : "customer@elfalba.com",
                },
                bypass: {
                    galaxia: {
                        ITEM_CODE: "G000000001", // 갤럭시아 필수 (최대 10자)
                    }
                },
                customData: {
                    jobId: id,
                    productId: selectedProductId
                },
                redirectUrl: `${window.location.origin}/api/payment/portone/verify?jobId=${id}&productId=${selectedProductId}`,
            });

            // 모바일의 경우 redirectUrl로 이동하므로 아래 코드는 PC에서만 실행됨
            if (!response || response.code != null) {
                // 오류 발생
                alert(response?.message || "결제 중 오류가 발생했습니다.");
                return;
            }

            // PC 결제 성공 -> 서버 검증 요청
            const verifyRes = await fetch('/api/payment/portone/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: response.paymentId,
                    jobId: id,
                    productId: selectedProductId
                })
            });

            if (verifyRes.ok) {
                const result = await verifyRes.json();
                router.push(`/employer/payments/success?success=true&isPopup=false&tid=${response.paymentId}&oid=${id}`);
            } else {
                const error = await verifyRes.json();
                alert(error.message || "결제 검증에 실패했습니다.");
            }
        } catch (err: any) {
            console.error('PortOne Payment Error:', err);
            alert(`결제 준비 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePaymentSubmit = async () => {
        if (paymentMethod === 'CARD') {
            await handlePortOnePayment()
            return
        }

        if (!selectedProductId) return
        if (!depositorName.trim()) {
            setShowNameError(true)
            return
        }

        setIsSubmitting(true)
        try {
            const product = products.find(p => p.id === selectedProductId)
            const res = await fetch('/api/employer/payments/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProductId,
                    jobId: id,
                    amount: product.price,
                    depositorName
                })
            })

            if (res.ok) {
                // Refresh to show pending state
                window.location.reload()
            } else {
                const data = await res.json()
                alert(data.error || '결제 요청 실패')
            }
        } catch (err) {
            alert('오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    const activeProducts = ['VVIP_SLOT', 'VIP_SLOT', 'GENERAL_SLOT'].map(type =>
        products.find(p => p.product_type === type && p.duration_days === selectedDays)
    ).filter(Boolean)

    const BANK_NAME = siteConfig?.bank_name || '국민은행'
    const ACCOUNT_NUMBER = siteConfig?.bank_account || '219401-04-263185'
    const BANK_OWNER = siteConfig?.bank_owner || '주세컨즈나인'

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-dark-bg transition-colors duration-300 pb-20">
            {/* Header */}
            <header className="w-full bg-white dark:bg-dark-card border-b border-gray-50 dark:border-dark-border sticky top-0 z-[2000] h-14 md:h-16 flex items-center">
                <div className="max-w-xl mx-auto px-4 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push('/employer')} className="text-gray-900 dark:text-gray-100 p-2 -ml-2 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition active:scale-95">
                            <ChevronLeft size={24} />
                        </button>
                        <CreditCard size={18} className="text-amber-500" />
                        <h1 className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">광고 결제</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8">
                {/* Hero / Step Info */}
                <div className="bg-amber-500 rounded-[35px] p-8 mb-6 relative overflow-hidden shadow-2xl shadow-amber-100 dark:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                {pendingPayment ? <Clock className="text-white" size={14} /> : <Rocket className="text-white" size={14} />}
                            </div>
                            <span className="text-white/80 text-[11px] font-black tracking-widest uppercase">
                                {pendingPayment ? 'Step 2: Awaiting Approval' : 'Step 1: Choose & Pay'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight">
                            {pendingPayment ? '공고 등록이 모두 확인되었습니다!' : '최적의 광고 효과로 인재를 찾아보세요'}
                        </h2>
                    </div>
                </div>

                {/* Job Summary Card (Dashboard Style) */}
                {job && (
                    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[30px] p-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 text-[10px] font-black px-2 py-0.5 rounded border border-gray-200 dark:border-dark-border shadow-sm">
                                NO.{job.job_no || '-'}
                            </span>
                            <span className="text-[12px] font-black text-amber-500">결제 대기중</span>
                        </div>

                        <div className="bg-gray-50 dark:bg-dark-bg/50 rounded-2xl p-4 flex gap-4 items-center border border-gray-100 dark:border-dark-border">
                            <div className="w-[52px] h-[52px] rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                {job.images?.[0] ? (
                                    <img src={job.images[0].image_url} className="w-full h-full object-cover" alt="" />
                                ) : <Briefcase size={20} className="text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-black text-gray-900 dark:text-white truncate mb-1">{job.title}</h3>
                                <div className="flex items-center gap-3">
                                    <div className="text-[11px] font-black text-amber-500">TC {job.salary_info || '협의'}</div>
                                    <div className="text-[10px] text-gray-400 font-bold">{job.region?.name} · {job.category?.name}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {pendingPayment ? (
                    /* CASE A: PENDING PAYMENT INFO */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <div className="bg-white dark:bg-dark-card rounded-[35px] border-2 border-gray-100 dark:border-dark-border p-8 shadow-xl">
                            <h4 className="text-[12px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-500" /> 신청 상품 내역
                            </h4>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] font-bold text-gray-400 dark:text-gray-500">광고 상품</span>
                                    <span className="text-[17px] font-black text-gray-900 dark:text-gray-100">{pendingPayment.product?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] font-bold text-gray-400 dark:text-gray-500">광고 기간</span>
                                    <span className="text-[17px] font-black text-gray-900 dark:text-gray-100">{pendingPayment.product?.duration_days}일 노출</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] font-bold text-gray-400 dark:text-gray-500">입금자명</span>
                                    <span className="text-[17px] font-black text-[#FF007A] bg-amber-50 dark:bg-pink-900/10 px-3 py-1 rounded-lg">{pendingPayment.depositor_name}</span>
                                </div>
                                <div className="pt-6 border-t border-gray-50 dark:border-dark-border flex justify-between items-center">
                                    <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">최종 결제 금액</span>
                                    <span className="text-[28px] font-black text-[#FF007A] tracking-tighter">{pendingPayment.amount?.toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>

                        {/* Bank info - reuse */}
                        <BankInfoSection
                            BANK_NAME={BANK_NAME}
                            BANK_OWNER={BANK_OWNER}
                            ACCOUNT_NUMBER={ACCOUNT_NUMBER}
                            isCopied={isCopied}
                            setIsCopied={setIsCopied}
                        />

                        <button
                            onClick={() => router.push('/employer')}
                            className="w-full h-16 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-[25px] font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            공고 관리로 돌아가기
                        </button>
                    </div>

                ) : (
                    /* CASE B: SELECT PRODUCT UI */
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Duration Selector */}
                        <div className="flex bg-gray-200 dark:bg-dark-card p-1.5 rounded-[22px] gap-1 shadow-inner">
                            {[30, 60, 90, 120].map(days => (
                                <button
                                    key={days}
                                    onClick={() => setSelectedDays(days)}
                                    className={`flex-1 py-3 text-[13px] font-bold rounded-2xl transition-all relative ${selectedDays === days
                                        ? 'bg-white dark:bg-dark-bg text-amber-500 shadow-md'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {days}일
                                    {days >= 60 && (
                                        <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-dark-card animate-pulse">SAVE</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Product Cards */}
                        <div className="space-y-4">
                            {activeProducts.map((product: any) => {
                                const isSelected = selectedProductId === product.id
                                const meta: Record<string, { badge: string; badgeColor: string; desc: string; tabDesc: string; discount?: string }> = {
                                    VVIP_SLOT: {
                                        badge: 'PREMIUM',
                                        badgeColor: 'bg-yellow-400 text-yellow-900',
                                        desc: `점프 ${product.jump_count?.toLocaleString()}회`,
                                        tabDesc: '프리미엄 탭 + 추천 탭 + 일반 탭 모두 노출',
                                        discount: selectedDays === 120 ? '18% 할인' : (selectedDays >= 60 ? '5%~ 할인' : undefined)
                                    },
                                    VIP_SLOT: {
                                        badge: 'RECOMMEND',
                                        badgeColor: 'bg-amber-500 text-white',
                                        desc: `점프 ${product.jump_count?.toLocaleString()}회`,
                                        tabDesc: '추천 탭 + 일반 탭 노출',
                                        discount: selectedDays >= 60 ? '5%~ 할인' : undefined
                                    },
                                    GENERAL_SLOT: {
                                        badge: 'BASIC',
                                        badgeColor: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-white',
                                        desc: `점프 ${product.jump_count?.toLocaleString()}회`,
                                        tabDesc: '일반 리스트 노출',
                                        discount: selectedDays >= 60 ? '5% 할인' : undefined
                                    },
                                }
                                const m = meta[product.product_type] || meta['GENERAL_SLOT']

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => setSelectedProductId(product.id)}
                                        className={`relative cursor-pointer rounded-[28px] border-2 p-6 transition-all duration-300 active:scale-[0.99] ${isSelected
                                            ? 'bg-white dark:bg-dark-card border-[#FF007A] shadow-xl ring-4 ring-amber-50 dark:ring-pink-900/10'
                                            : 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border hover:border-amber-200 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                                                    {selectedDays === 30 ? product.name.split(' (')[0] : product.name}
                                                </h3>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.badgeColor}`}>{m.badge}</span>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#FF007A] bg-[#FF007A]' : 'border-gray-200 dark:border-gray-700'}`}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                                            </div>
                                        </div>

                                        <div className="flex items-end gap-2 mb-4">
                                            <div>
                                                <span className={`text-[26px] font-black tracking-tighter ${isSelected ? 'text-[#FF007A]' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {product.price.toLocaleString()}
                                                </span>
                                                <span className="text-sm font-bold text-gray-400 ml-1">원</span>
                                            </div>
                                            {m.discount && (
                                                <div className="mb-2 bg-amber-100 dark:bg-pink-900/30 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                                    {m.discount}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`pt-4 border-t ${isSelected ? 'border-amber-50 dark:border-pink-900/20' : 'border-gray-50 dark:border-dark-border'} space-y-2`}>
                                            <div className="flex items-center gap-2">
                                                <Zap size={12} className="text-amber-500" />
                                                <span className={`text-[12px] font-black ${isSelected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'}`}>{m.desc}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Rocket size={12} className="text-blue-500" />
                                                <p className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>{m.tabDesc}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-4">
                            <h3 className="text-gray-900 dark:text-gray-100 font-black text-sm px-1">결제 수단 선택</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'CARD' ? 'border-[#FF007A] bg-amber-50/50 dark:bg-pink-900/10' : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card hover:border-gray-200'}`}
                                >
                                    <CardIcon size={20} className={paymentMethod === 'CARD' ? 'text-amber-500' : 'text-gray-400'} />
                                    <span className={`text-[12px] font-black ${paymentMethod === 'CARD' ? 'text-amber-500' : 'text-gray-500'}`}>신용카드</span>
                                    {paymentMethod === 'CARD' && <Check size={14} className="absolute top-2 right-2 text-amber-500" />}
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'BANK_TRANSFER' ? 'border-[#FF007A] bg-amber-50/50 dark:bg-pink-900/10' : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card hover:border-gray-200'}`}
                                >
                                    <Building2 size={20} className={paymentMethod === 'BANK_TRANSFER' ? 'text-amber-500' : 'text-gray-400'} />
                                    <span className={`text-[12px] font-black ${paymentMethod === 'BANK_TRANSFER' ? 'text-amber-500' : 'text-gray-500'}`}>무통장 입금</span>
                                    {paymentMethod === 'BANK_TRANSFER' && <Check size={14} className="absolute top-2 right-2 text-amber-500" />}
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'BANK_TRANSFER' ? (
                            <>
                                <div className="bg-white dark:bg-dark-card rounded-[24px] p-5 border border-gray-100 dark:border-dark-border space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h3 className="text-gray-900 dark:text-gray-100 font-black text-sm px-1">입금자명 정보</h3>
                                    <input
                                        type="text"
                                        value={depositorName}
                                        onChange={e => {
                                            setDepositorName(e.target.value)
                                            if (e.target.value.trim()) setShowNameError(false)
                                        }}
                                        placeholder="입금하실 성함을 입력해주세요"
                                        className={`w-full h-12 bg-white dark:bg-dark-bg border rounded-[15px] px-4 text-[13px] font-bold text-gray-900 dark:text-gray-100 outline-none transition focus:ring-4 focus:ring-amber-50 dark:focus:ring-pink-900/10 ${showNameError ? 'border-red-500 bg-red-50' : 'border-gray-100 dark:border-dark-border focus:border-amber-300'}`}
                                    />
                                    {showNameError && <p className="text-red-500 text-[11px] font-bold ml-1">입금자명을 입력해야 신청이 가능합니다.</p>}
                                </div>
                                <BankInfoSection
                                    BANK_NAME={BANK_NAME}
                                    BANK_OWNER={BANK_OWNER}
                                    ACCOUNT_NUMBER={ACCOUNT_NUMBER}
                                    isCopied={isCopied}
                                    setIsCopied={setIsCopied}
                                />
                            </>
                        ) : (
                            <div className="bg-white dark:bg-dark-card rounded-[24px] p-6 border border-gray-100 dark:border-dark-border space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <h3 className="text-gray-900 dark:text-gray-100 font-black text-sm">카드 결제 안내</h3>
                                <ul className="text-[11px] text-gray-400 dark:text-gray-500 space-y-1.5 list-disc pl-4 font-bold">
                                    <li>카드 결제 시 즉시 광고가 활성화되거나 관리자 승인 대기 상태로 전환됩니다.</li>
                                    <li>결제 창이 뜨지 않으면 팝업 차단 설정을 확인해주세요.</li>
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={handlePaymentSubmit}
                            disabled={!selectedProductId || isSubmitting}
                            className="w-full h-20 bg-[#FF007A] text-white rounded-[30px] font-black text-xl shadow-2xl shadow-amber-200 dark:shadow-none flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale transition-all duration-300"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><span>{paymentMethod === 'CARD' ? '카드 결제하기' : '무통장 입금 신청하기'}</span><ChevronRight size={24} /></>
                            )}
                        </button>

                    </div>
                )}
            </main>

            <footer className="py-10 text-center text-[10px] text-gray-300 dark:text-gray-600">
                Copyright. {new Date().getFullYear()} 엘프알바 No.1 All rights reserved.
            </footer>
        </div>
    )
}

function BankInfoSection({ BANK_NAME, BANK_OWNER, ACCOUNT_NUMBER, isCopied, setIsCopied }: any) {
    return (
        <div className="bg-white dark:bg-dark-card rounded-[24px] p-5 border border-gray-100 dark:border-dark-border space-y-4 shadow-sm">
            <div className="flex bg-gray-50 dark:bg-dark-bg p-5 rounded-2xl border border-gray-50 dark:border-dark-border/50 group relative">
                <div className="space-y-1">
                    <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500">{BANK_NAME} <span className="text-amber-500 font-black">{BANK_OWNER}</span></p>
                    <p className="text-[20px] font-black text-gray-900 dark:text-gray-100 tracking-tight">{ACCOUNT_NUMBER}</p>
                </div>

                <button
                    onClick={() => {
                        navigator.clipboard.writeText(`${BANK_NAME} ${ACCOUNT_NUMBER} ${BANK_OWNER}`)
                        setIsCopied(true)
                        setTimeout(() => setIsCopied(false), 2000)
                    }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all ${isCopied ? 'bg-[#FF007A] text-white' : 'bg-white dark:bg-dark-card text-gray-400 border border-gray-100 dark:border-dark-border shadow-sm'}`}
                >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    {isCopied ? '복사됨' : '계좌복사'}
                </button>
            </div>
        </div>
    )
}
