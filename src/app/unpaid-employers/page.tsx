import React from 'react'
import { AlertTriangle, Info, ExternalLink } from 'lucide-react'

export default function UnpaidEmployersPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                            <AlertTriangle size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">체불사업자 명단 공개 안내</h1>
                    </div>

                    <p className="text-gray-600 font-medium leading-relaxed mb-8">
                        엘프알바는 근로자의 권익을 보호하고 건전한 고용 환경을 조성하기 위해,<br />
                        고용노동부에서 공개하는 고액·상습 체불사업자 명단을 안내해 드립니다.
                    </p>

                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex gap-4">
                        <Info className="text-blue-500 shrink-0" size={20} />
                        <div className="text-[13px] text-blue-800 font-medium leading-[1.6]">
                            본 게시판은 고용노동부 근로기준법 제43조의2에 근거하여 공개되는 명단을 바탕으로 합니다. 체불 사업자 명단은 구직 시 반드시 확인하시어 피해를 예방하시기 바랍니다.
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                        실시간 명단 확인 방법
                    </h2>

                    <div className="space-y-4">
                        <p className="text-[14px] text-gray-500 font-medium leading-relaxed">
                            체불사업자 명단은 매년 업데이트되며, 최신 명단은 고용노동부 공식 홈페이지에서 직접 검색하여 확인하실 수 있습니다.
                        </p>

                        <a
                            href="https://www.moel.go.kr/info/defaulter/defaulterList.do"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[14px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gray-200"
                        >
                            고용노동부 체불사업자 명단 바로가기
                            <ExternalLink size={16} />
                        </a>
                    </div>

                    <div className="mt-10 pt-10 border-t border-gray-50">
                        <h3 className="font-black text-gray-800 mb-4 text-[15px]">체불 피해 시 대처 방법</h3>
                        <ul className="space-y-3 text-[13px] text-gray-500 font-medium">
                            <li className="flex gap-2">
                                <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                                고용노동부 홈페이지 또는 관할 고용노동청 방문 신고
                            </li>
                            <li className="flex gap-2">
                                <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                                상담 전화: 고용노동부 고객상담센터 (국번없이 1350)
                            </li>
                            <li className="flex gap-2">
                                <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                                법률구조공단 무료법률구조사업 지원 신청
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
