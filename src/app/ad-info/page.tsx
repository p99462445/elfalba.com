'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles, CreditCard, Zap, Rocket, Crown, Star, ChevronRight } from 'lucide-react'

export default function AdvertisePage() {
    const router = useRouter()
    const [products, setProducts] = useState<any[]>([])
    const [selectedDays, setSelectedDays] = useState(30)
    const [loading, setLoading] = useState(true)
    const [siteConfig, setSiteConfig] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, cfgRes] = await Promise.all([
                    fetch('/api/employer/products'),
                    fetch('/api/common/site-config')
                ])
                if (prodRes.ok) setProducts(await prodRes.json())
                if (cfgRes.ok) setSiteConfig(await cfgRes.json())
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const activeProducts = ['VVIP_SLOT', 'VIP_SLOT', 'GENERAL_SLOT'].map(type =>
        products.find(p => p.product_type === type && p.duration_days === selectedDays)
    ).filter(Boolean)

    const bankName = siteConfig?.bank_name || '국민은행'
    const bankAccount = siteConfig?.bank_account || '219401-04-263185'
    const bankOwner = siteConfig?.bank_owner || '주세컨즈나인'

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-dark-bg transition-colors duration-300">
            <header className="w-full bg-white dark:bg-dark-card border-b border-gray-50 dark:border-dark-border sticky top-0 z-[2000] h-14 md:h-16 flex items-center">
                <div className="max-w-2xl mx-auto px-4 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push('/')} className="text-gray-900 dark:text-gray-100 p-2 -ml-2 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition active:scale-95">
                            <ChevronLeft size={24} />
                        </button>
                        <CreditCard size={18} className="text-amber-500" />
                        <h1 className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">광고안내</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto px-4 py-10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white dark:bg-dark-card rounded-[30px] shadow-xl shadow-amber-100 dark:shadow-none flex items-center justify-center mx-auto mb-6 transform -rotate-6 border border-amber-50 dark:border-amber-500/20">
                        <Sparkles className="text-amber-400" size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tighter">최적의 광고 상품으로<br />지원을 늘려보세요</h1>
                    <p className="text-gray-400 dark:text-gray-500 mt-4 font-bold text-sm">노출 시간과 등급을 자유롭게 선택하세요.</p>
                </div>

                {/* Duration Selector */}
                <div className="flex bg-gray-200 dark:bg-dark-card p-1.5 rounded-[22px] gap-1 mb-8 shadow-inner">
                    {[30, 60, 90, 120].map(days => (
                        <button
                            key={days}
                            onClick={() => setSelectedDays(days)}
                            className={`flex-1 py-3 text-[13px] font-black rounded-2xl transition-all relative ${selectedDays === days
                                    ? 'bg-white dark:bg-dark-bg text-amber-500 shadow-md scale-[1.02]'
                                    : 'text-gray-400 hover:text-gray-500'
                                }`}
                        >
                            {days}일
                            {days >= 60 && (
                                <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-dark-card">
                                    SAVE
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-44 bg-gray-100 dark:bg-dark-card rounded-[28px] animate-pulse" />)
                    ) : (
                        activeProducts.map((product: any) => {
                            const meta: Record<string, { badge: string; badgeColor: string; desc: string; tabDesc: string; icon: any; discount?: string }> = {
                                VVIP_SLOT: {
                                    badge: 'PREMIUM',
                                    badgeColor: 'bg-yellow-400 text-yellow-900',
                                    desc: `점프 ${product.jump_count?.toLocaleString()}회 부여`,
                                    tabDesc: '프리미엄 + 추천 + 일반 리스트 모두 노출',
                                    icon: <Crown className="text-yellow-500" size={24} />,
                                    discount: selectedDays === 120 ? '18% 할인' : (selectedDays >= 60 ? '약 5%~ 할인' : undefined)
                                },
                                VIP_SLOT: {
                                    badge: 'FEATURED',
                                    badgeColor: 'bg-amber-500 text-white',
                                    desc: `점프 ${product.jump_count?.toLocaleString()}회 부여`,
                                    tabDesc: '추천 리스트 + 일반 리스트 노출',
                                    icon: <Star className="text-amber-500" size={24} />,
                                    discount: selectedDays >= 60 ? '약 5%~ 할인' : undefined
                                },
                                GENERAL_SLOT: {
                                    badge: 'BASIC',
                                    badgeColor: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                                    desc: `점프 ${product.jump_count?.toLocaleString()}회 부여`,
                                    tabDesc: '일반 공고 리스트 노출',
                                    icon: <Rocket className="text-gray-400" size={24} />,
                                    discount: selectedDays >= 60 ? '5% 할인' : undefined
                                },
                            }
                            const m = meta[product.product_type] || meta['GENERAL_SLOT']

                            return (
                                <div
                                    key={product.id}
                                    className="bg-white dark:bg-dark-card rounded-[28px] border-2 border-white dark:border-dark-border p-6 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-12 h-12 bg-gray-50 dark:bg-dark-bg rounded-2xl flex items-center justify-center">
                                                {m.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">{selectedDays === 30 ? product.name.split(' (')[0] : product.name}</h3>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.badgeColor}`}>{m.badge}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold">{selectedDays}일 노출 기준</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                {m.discount && <span className="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-lg">{m.discount}</span>}
                                                <p className="text-2xl font-black text-amber-500 tracking-tighter">
                                                    {product.price.toLocaleString()}원
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-5 border-t border-gray-50 dark:border-dark-border space-y-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-5 h-5 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center"><Zap size={12} className="text-amber-500" /></div>
                                            <span className="text-[13px] font-black text-gray-700 dark:text-gray-300">{m.desc}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-5 h-5 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center"><Rocket size={12} className="text-blue-500" /></div>
                                            <span className="text-[13px] font-black text-gray-700 dark:text-gray-300">{m.tabDesc}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => router.push('/employer/jobs/new')}
                        className="w-full h-16 bg-amber-500 text-white rounded-[25px] font-black text-lg shadow-xl shadow-amber-100 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        공고 무료로 작성하기 <ChevronRight size={20} />
                    </button>
                </div>

                <div className="mt-16 p-8 bg-gray-900 dark:bg-dark-card border dark:border-dark-border rounded-[35px] text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <h3 className="text-white text-sm font-black mb-6 opacity-60 tracking-widest uppercase">Direct Transfer</h3>
                    <div className="space-y-2 relative z-10">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{bankName}</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{bankAccount}</p>
                        <p className="text-sm text-amber-400 font-black">예금주: {bankOwner}</p>
                    </div>
                </div>
            </div>

            <footer className="py-10 text-center text-[10px] text-gray-300 dark:text-gray-600">
                Copyright. {new Date().getFullYear()} 엘프알바 No.1 All rights reserved.
            </footer>
        </div>
    )
}
