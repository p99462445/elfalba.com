'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function PrivacyPage() {
    const router = useRouter()
    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4">
                <div className="max-w-4xl mx-auto w-full flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 mr-1 text-gray-600 hover:text-gray-900 active:scale-95 transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-black text-gray-900 text-[17px]">개인정보 처리방침</span>
                </div>
            </div>

            <div className="px-4 pt-10">
                <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-8 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">개인정보 처리방침</h1>
                        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase">Privacy Policy</p>
                    </div>

                    <div className="prose prose-amber max-w-none space-y-12 text-[15px] leading-relaxed text-gray-600">
                        <section className="bg-amber-50/30 p-8 rounded-[30px] border border-amber-100/50">
                            <p className="font-bold text-gray-800 leading-loose">
                                '엘프알바'는 (이하 '회사'는) 고객님의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다.
                                회사는 개인정보처리방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                            </p>
                            <p className="mt-4 text-gray-500 font-medium">
                                회사는 개인정보처리방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 gap-12 pt-4">
                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">1</span>
                                    개인정보의 수집 및 이용 목적
                                </h2>
                                <p className="mb-4 font-medium">개인정보는 생존하는 개인에 관한 정보로서 실명, 전화번호 등의 사항으로 당사 회원 개인을 식별할 수 있는 정보(당해 정보만으로는 특정 개인을 식별할 수 없더라도 다른 정보와 용이하게 결합하여 식별할 수 있는 것을 포함)를 말합니다. 당사가 수집한 개인정보는 다음의 목적을 위해 활용합니다.</p>
                                <ul className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <li className="flex gap-3"><span className="text-amber-500 font-black">①</span> <span>서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산, 콘텐츠 제공 등</span></li>
                                    <li className="flex gap-3"><span className="text-amber-500 font-black">②</span> <span>회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정 이용 방지 등의 목적</span></li>
                                    <li className="flex gap-3"><span className="text-amber-500 font-black">③</span> <span>회원의 서비스 이용에 대한 통계 등의 목적</span></li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">2</span>
                                    수집하는 개인정보 항목 및 수집방법
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[16px] font-black text-gray-800 mb-3">가. 수집하는 개인정보 항목</h3>
                                        <p className="mb-3">최초 회원가입시 회원식별 및 최적화된 서비스 제공을 위해 아래와 같은 정보를 수집합니다.</p>
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-2">
                                            <p className="text-gray-800"><span className="font-black text-amber-500 mr-2">[필수정보]</span> 이름, 아이디, 비밀번호, 성별, 연락처, 이메일</p>
                                            <p className="text-gray-800"><span className="font-black text-gray-400 mr-2">[선택정보]</span> 생년월일, 주소</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-black text-gray-800 mb-3">나. 수집방법</h3>
                                        <p className="mb-3">당사는 다음과 같은 방법으로 개인정보를 수집합니다.</p>
                                        <ul className="list-disc pl-5 space-y-1 font-medium text-gray-500">
                                            <li>홈페이지를 통한 회원가입, 상담 게시판, 경품 행사응모, 배송 요청</li>
                                            <li>생성정보 수집 툴을 통한 수집</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">3</span>
                                    수집하는 개인정보의 보유 및 이용기간
                                </h2>
                                <p className="mb-6">원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간동안 보존합니다.</p>
                                <div className="space-y-4">
                                    <div className="p-6 bg-amber-50/20 rounded-2xl border border-amber-100/50">
                                        <h4 className="font-black text-gray-800 mb-2">① 회원탈퇴시 보존 개인정보</h4>
                                        <ul className="text-[13px] space-y-1 text-gray-500 font-medium">
                                            <li><span className="font-bold text-gray-700">보존항목:</span> 회원님께서 제공한 이름, 아이디, 이메일주소, 주소, 전화번호</li>
                                            <li><span className="font-bold text-gray-700">보존근거:</span> 불량 이용자의 재가입 방지, 명예훼손 등 권리침해 분쟁 및 수사협조</li>
                                            <li><span className="font-bold text-amber-500">보존기간: 회원탈퇴 후 1년</span></li>
                                        </ul>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <h4 className="font-black text-gray-800 mb-2">② 상거래 관련 보존 개인정보</h4>
                                        <ul className="text-[13px] space-y-1 text-gray-500 font-medium">
                                            <li><span className="font-bold text-gray-700">보존항목:</span> 상거래이력</li>
                                            <li><span className="font-bold text-gray-700">보존근거:</span> 상법, 전자상거래등에서의 소비자보호에 관한 법률</li>
                                            <li><span className="font-bold text-gray-700">보존기간:</span> 계약 또는 청약철회 등에 관한 기록 (5년), 대금결제 및 재화등의 공급 기록 (5년), 소비자의 불만 또는 분쟁처리 기록 (3년)</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">4</span>
                                    개인정보의 파기절차 및 방법
                                </h2>
                                <div className="space-y-4">
                                    <p><span className="font-black text-gray-800">① 파기절차:</span> 회원님이 회원가입 등을 위해 입력하신 정보는 목적이 달성된 후 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기되어집니다. 동 개인정보는 법률에 의한 경우가 아니고서는 보유되어지는 이외의 다른 목적으로 이용되지 않습니다.</p>
                                    <p><span className="font-black text-gray-800">② 파기방법:</span> 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기하고 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">5</span>
                                    개인정보의 제공 및 공유
                                </h2>
                                <p className="mb-4">원칙적으로 당사는 회원님의 개인정보를 수집 및 이용목적에 한해서만 이용하며 타인 또는 타기업·기관에 공개하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
                                <ul className="space-y-4">
                                    <li className="p-5 bg-gray-50 rounded-2xl border border-gray-100"><span className="font-black text-gray-800 block mb-1">① 이용자들이 사전에 동의한 경우</span> 회원님께 비즈니스 파트너가 누구인지, 어떤 정보가 왜 필요한지 등 동의를 구하는 절차를 거치며, 동의하지 않는 경우 공유하지 않습니다.</li>
                                    <li className="p-5 bg-gray-50 rounded-2xl border border-gray-100"><span className="font-black text-gray-800 block mb-1">② 법령의 규정에 의거하거나 수사 기관의 요구가 있는 경우</span></li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">6</span>
                                    개인정보의 위탁처리
                                </h2>
                                <p className="leading-loose">회사는 서비스 향상을 위해서 이용자들의 개인정보를 외부에 위탁하여 처리할 수 있습니다. 위탁 시 미리 공지하며 지시엄수, 비밀유지, 제3자 제공 금지 등을 명확히 규정할 것입니다. 회사는 다양한 서비스 제공을 목적으로 전문 파트너사와 제휴를 맺을 수 있으며, 회원이 해당 제휴 서비스를 사용할 수 있도록 이름이나 주소 등 제한된 범위의 개인정보를 공유할 수 있습니다.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">7</span>
                                    이용자 및 법정대리인의 권리와 그 행사방법
                                </h2>
                                <ul className="list-disc pl-5 space-y-2 font-medium">
                                    <li>이용자 및 법정 대리인은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다.</li>
                                    <li>'내 정보관리' 또는 '헬프데스크'를 통해 직접 열람, 정정 또는 탈퇴가 가능합니다.</li>
                                    <li>개인정보관리책임자에게 연락하시면 지체 없이 조치하겠습니다.</li>
                                    <li>오류 정정 요청 시 정정 완료 전까지 해당 정보를 이용하거나 제공하지 않습니다.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[14px]">8</span>
                                    개인정보 자동 수집 장치의 설치·운영 및 거부
                                </h2>
                                <div className="space-y-4">
                                    <p>회사는 개인화된 맞춤형 서비스를 제공하기 위해 회원님의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</p>
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="font-black text-gray-800 mb-2">설정 거부 방법</p>
                                        <p className="text-[13px]">웹 브라우저의 옵션을 설정함으로써 모든 쿠키를 허용하거나, 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다. (예: 도구 {'>'} 인터넷 옵션 {'>'} 개인정보)</p>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-gray-900 text-white p-10 rounded-[40px] shadow-xl">
                                <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-amber-500 text-white rounded-xl flex items-center justify-center text-[14px]">9</span>
                                    개인정보관리책임자 및 연락처
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">관리 책임 및 담당자</p>
                                        <div className="space-y-2">
                                            <p className="text-2xl font-black">박근홍</p>
                                            <p className="text-gray-400 font-bold">1899-0930</p>
                                            <p className="text-amber-400 font-bold">p99462445@gmail.com</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-end items-end">
                                        <p className="text-gray-500 text-[11px] font-bold">시행일 : 2026년 3월 10일</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <p className="mt-16 text-[10px] text-gray-300 text-center uppercase tracking-[0.3em] font-black">
                        © 2026 Elfalba Team. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}
