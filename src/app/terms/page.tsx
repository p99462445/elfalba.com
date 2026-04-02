'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function TermsPage() {
    const router = useRouter()
    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4">
                <div className="max-w-4xl mx-auto w-full flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 mr-1 text-gray-600 hover:text-gray-900 active:scale-95 transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-black text-gray-900 text-[17px]">이용약관</span>
                </div>
            </div>

            <div className="px-4 pt-10 text-gray-700">
                <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-8 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">이용약관</h1>
                        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase">Terms of Service</p>
                    </div>

                    <div className="space-y-12 text-[14px] leading-relaxed">
                        {/* 제1장 총칙 */}
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-6 pb-2 border-b-2 border-amber-100 inline-block">제1장 총칙</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 1 조 (목적)</h3>
                                    <p>본 약관은 모델·연기자·방송 정보제공 사이트 엘프알바(이하 "회사"라 한다)이 인터넷을 통하여 운영하는 엘프알바(elfalba.com) 서비스를 제공함에 있어 이를 이용하는 이용자와 엘프알바의 권리, 의무 및 책임사항을 규정함을 목적으로 한다.</p>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 2 조 (용어의 정의)</h3>
                                    <p className="mb-2 text-gray-500">이 약관에서 사용하는 용어의 정의는 아래와 같다.</p>
                                    <ul className="space-y-2 pl-4 border-l-2 border-gray-100">
                                        <li>① "회사"라 함은 인터넷 사이트 엘프알바(elfalba.com)를 운영하는 사이트를 말한다.</li>
                                        <li>② "서비스"라 함은 인터넷 엘프알바(elfalba.com) 사이트 및 정보통신설비 등을 이용하여 엘프알바에서 등록하는 구인자료, 구직과 교육을 목적으로 등록하는 자료 등을 각각의 목적에 맞게 분류 가공, 집계하여 정보를 제공하는 내용 및 기타 관련된 부대 서비스를 말한다.</li>
                                        <li>③ "개인회원"이라 함은 서비스를 이용하기 위하여 동 약관에 동의하고 "회사"와 이용계약을 체결하여 "이용자ID"를 부여 받은 개인을 말한다.</li>
                                        <li>④ "업소회원"이라 함은 자사의 인력채용을 목적으로 서비스를 이용하기 위하여 동 약관에 동의하여 "이용자ID"를 부여 받은 기업과 단체를 말한다.</li>
                                        <li>⑤ "이용자ID" 또는 "회원ID"라 함은 회원의 식별과 회원의 서비스 이용을 위하여 회원이 선정하고 회사가 부여하는 문자와 숫자의 조합을 말한다.</li>
                                        <li>⑥ "비밀번호"라 함은 "회사"의 서비스를 이용하려는 사람이 "이용자ID"를 부여 받은 자와 동일인임을 확인하고 회원의 권익을 보호하기 위하여 회원이 선정한 문자와 숫자의 조합을 말한다.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 3 조 (약관의 효력 및 개정)</h3>
                                    <ul className="space-y-2">
                                        <li>① 이 약관은 "회사"가 운영하는 "사이트"를 통하여 이를 공지하거나 전자우편 기타의 방법으로 회원에게 통지함으로써 효력이 발생된다.</li>
                                        <li>② "회사"는 관련법규를 준수하는 범위 내에서 이 약관을 개정할 수 있으며, 사정상 중요한 사유가 발생될 경우 사전 고지 없이 이 약관의 내용을 변경할 수 있다.</li>
                                        <li>③ 약관 개정 시 적용일자 7일 이전부터(이용자에게 불리한 경우 30일 이전) 공지하며, 변경된 약관에 동의하지 않을 경우 탈퇴 요청이 가능합니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 제2장 서비스 이용계약 */}
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-6 pb-2 border-b-2 border-amber-100 inline-block">제2장 서비스 이용계약</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 5 조 (이용계약의 성립)</h3>
                                    <p>회원이 본 이용약관 하단의 "동의함" 버튼을 누르면 본 약관 및 개인정보보호정책에 대하여도 동의한 것으로 간주하며, 회사의 승낙으로써 이용계약이 성립합니다.</p>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 6 조 (서비스 이용신청)</h3>
                                    <p>이용고객은 실명 가입을 하여야 하며, 사업자등록증 상의 업소명, 주소만을 사용하여 본 서비스를 이용하여야 합니다. 타인의 명의를 도용할 경우 관계법령에 따라 처벌받을 수 있습니다.</p>
                                </div>
                            </div>
                        </section>

                        {/* 제3장 서비스 이용 */}
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-6 pb-2 border-b-2 border-amber-100 inline-block">제3장 서비스 이용</h2>
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="font-black text-gray-800 mb-3">▶ 제 10 조 (채용공고 등록 및 제한)</h3>
                                    <p className="mb-3">다음 사항에 해당할 경우 사전 통지 없이 공고가 삭제될 수 있습니다.</p>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[13px] text-gray-500">
                                        <li>• 구인을 가장한 물품판매, 자금모집 등</li>
                                        <li>• 성매매 관련 광고나 유도 단어 사용</li>
                                        <li>• 허위 사실 기재 및 타인 비방</li>
                                        <li>• 고의적인 미풍양속 저해 행위</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 11 조 (서비스의 요금)</h3>
                                    <p>기본 가입은 무료이며, 광고 효과를 높이기 위한 유료 서비스는 사이트에 명시된 요금 체계에 따릅니다. 요금은 서비스 종류 및 기간에 따라 변경될 수 있습니다.</p>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 12 조 (서비스 이용시간)</h3>
                                    <p>연중무휴 24시간 제공을 원칙으로 하되, 시스템 점검이나 장비 교체 등 필요 시 일시 중단될 수 있습니다.</p>
                                </div>
                            </div>
                        </section>

                        {/* 제4장 계약 해지 및 환불 */}
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-6 pb-2 border-b-2 border-amber-100 inline-block">제4장 계약 해지 및 이용 제한</h2>
                            <div className="space-y-6">
                                <div className="p-6 bg-amber-50/20 rounded-2xl border border-amber-100/50">
                                    <h3 className="font-black text-amber-600 mb-4">▶ 제 18 조 (환불규정)</h3>
                                    <div className="space-y-4 text-[13px]">
                                        <p><strong>가. 미할인 적용 상품:</strong> 결제금액 - [결제금액 * (경과일수/전체이용기간)] - 환불수수료(10%) - 초과점프사용분</p>
                                        <p><strong>나. 할인 적용 상품:</strong> 결제금액 - [할인전이용금액 * (경과일수/전체이용기간)] - 환불수수료(10%) - 초과점프사용분</p>
                                        <p className="text-gray-400 italic">* 환불수수료는 재정경제부 고시 소비자피해보상 규정에 의거하여 산정됩니다.</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 mb-2">▶ 제 19 조 (손해배상 및 면책)</h3>
                                    <p>회사는 회원이 게재한 정보의 신뢰도 및 정확성에 대해 책임을 지지 않으며, 성매매 광고 등 불법 행위로 인해 회사에 손해가 발생할 경우 해당 회원에게 손해배상을 청구할 수 있습니다.</p>
                                </div>
                            </div>
                        </section>

                        {/* 시행일 */}
                        <section className="bg-gray-900 text-white p-10 rounded-[40px] shadow-xl text-center">
                            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Effective Date</p>
                            <p className="text-2xl font-black tracking-tighter">본 약관은 2026년 03월 10일부터 시행합니다.</p>
                        </section>
                    </div>

                    <p className="mt-16 text-[10px] text-gray-300 text-center uppercase tracking-[0.3em] font-black">
                        © 2026 Elfalba. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}
