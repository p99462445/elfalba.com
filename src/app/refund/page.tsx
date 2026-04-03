'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ShieldCheck, Zap, Heart, Clock, Headphones } from 'lucide-react'

export default function RefundPolicyPage() {
    const router = useRouter()
    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4">
                <div className="max-w-4xl mx-auto w-full flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 mr-1 text-gray-600 hover:text-gray-900 active:scale-95 transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-black text-gray-900 text-[17px]">환불 정책</span>
                </div>
            </div>

            <div className="px-4 pt-10">
                <div className="max-w-3xl mx-auto bg-white rounded-[40px] p-8 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -ml-32 -mb-32" />

                    <div className="text-center mb-16 relative z-10">
                        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100">
                            <ShieldCheck size={40} className="text-amber-500" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tighter break-keep">
                            엘프알바 사장님<br />안심 환불 보장
                        </h1>
                        <p className="text-gray-500 font-bold text-base md:text-lg max-w-md mx-auto leading-relaxed break-keep">
                            엘프알바는 사장님의 성공을 응원합니다.<br />
                            업계에서 가장 투명하고 관대한 환불을 약속드립니다.
                        </p>
                    </div>

                    <div className="space-y-10 relative z-10">
                        {/* 1. 전액 환불 */}
                        <section className="bg-amber-50/30 rounded-3xl p-8 border border-amber-100 group hover:border-amber-400 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-amber-500 flex-shrink-0">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 mb-2">1. 24시간 "묻지마" 전액 환불</h2>
                                    <p className="text-gray-600 leading-relaxed text-[15px] break-keep">
                                        광고 결제 후 **24시간 이내**에는 공고 노출 여부와 관계없이 **100% 전액 환불**이 가능합니다. 
                                        단순 변심, 실수로 인한 결제 등 어떠한 이유라도 괜찮습니다. 사장님의 실수는 엘프알바가 책임집니다.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 2. 일할 계산 */}
                        <section className="p-8 rounded-3xl border border-gray-100 hover:border-blue-200 transition-colors bg-white">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm text-blue-500 flex-shrink-0">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 mb-2">2. 수수료 없는 100% 일할 계산</h2>
                                    <p className="text-gray-600 leading-relaxed text-[15px] break-keep">
                                        이미 광고가 시작되었나요? 갑자기 채용이 완료되어 광고가 더 이상 필요 없으신가요? 
                                        엘프알바는 사용하지 않은 **잔여 일수만큼 100% 일할 계산**하여 위약금이나 수수료 없이 그대로 돌려드립니다.
                                    </p>
                                    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100 inline-block font-black text-amber-600 text-sm">
                                        환불금액 = 결제금액 × (잔여 일수 / 전체 기간)
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. 매칭 실패 보증 */}
                        <section className="p-8 rounded-3xl border border-gray-100 hover:border-pink-200 transition-colors bg-white">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center shadow-sm text-pink-500 flex-shrink-0">
                                    <Heart size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 mb-2">3. 인재 매칭 실패 시 100% 보증</h2>
                                    <p className="text-gray-600 leading-relaxed text-[15px] break-keep">
                                        유료 광고 기간 동안 단 한 명의 지원자도 없었나요? 
                                        고객센터로 문의 주시면 내부 검토 후 **광고비를 100% 포인트로 재충전**해 드리거나, **광고 기간을 2배로 무상 연장**해 드립니다. 
                                        사장님이 인재를 찾으실 때까지 엘프알바가 끝까지 함께합니다.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 4. 빠른 처리 */}
                        <section className="bg-gray-900 rounded-3xl p-10 text-center shadow-xl">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Headphones size={32} className="text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-4">당일 즉시 환불 프로세스</h2>
                            <p className="text-gray-400 leading-relaxed mb-8 text-[15px] break-keep">
                                복잡한 서류나 까다로운 승인 절차를 없앴습니다.<br />
                                <strong>1899-0930</strong> 또는 <strong>카카오톡 1:1 상담</strong>으로<br />
                                계좌번호만 알려주시면 당일 즉시 입금을 약속드립니다.
                            </p>
                            <div className="flex flex-col md:flex-row gap-3 justify-center">
                                <a href="tel:1899-0930" className="h-14 bg-amber-500 text-white rounded-2xl px-8 flex items-center justify-center font-black gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                                    전화 문의하기
                                </a>
                                <a href="https://pf.kakao.com/elfalba1/chat" target="_blank" className="h-14 bg-[#FEE500] text-[#191919] rounded-2xl px-8 flex items-center justify-center font-black gap-2 hover:scale-105 active:scale-95 transition-all">
                                    카카오톡 환불 신청
                                </a>
                            </div>
                        </section>
                    </div>

                    <p className="mt-20 text-[10px] text-gray-300 text-center uppercase tracking-[0.3em] font-black">
                        © 2026 Elfalba. Trust & Communication.
                    </p>
                </div>
            </div>
        </div>
    )
}
