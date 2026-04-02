'use client'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'

export default function AuthCodeErrorPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const errorDescription = searchParams.get('error_description') || '알 수 없는 인증 오류가 발생했습니다.'
    const isSecretIssue = errorDescription.toLowerCase().includes('exchange') || errorDescription.toLowerCase().includes('client')

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[400px] text-center">
                <div className="w-20 h-20 bg-amber-50 dark:bg-pink-900/10 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-8 animate-bounce">
                    <AlertCircle size={40} />
                </div>

                <h1 className="text-[22px] font-black text-gray-900 dark:text-white mb-4">로그인 통신 오류</h1>

                <div className="bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 mb-8 text-left">
                    <p className="text-[13px] font-bold text-gray-400 mb-2">상세 에러 내용:</p>
                    <code className="text-[12px] font-mono text-amber-500 break-all leading-relaxed bg-white dark:bg-dark-bg p-3 block rounded-lg border border-amber-100 dark:border-pink-900/30">
                        {errorDescription}
                    </code>

                    {isSecretIssue && (
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-pink-900/10 rounded-xl border border-amber-100 dark:border-pink-900/20">
                            <p className="text-[12px] font-bold text-amber-600 leading-relaxed">
                                💡 사장님! 구글 클라우드에서 복사하신 **[비밀번호(Client Secret)]**가 슈퍼베이스 설정값과 일치하지 않는 것 같습니다. 다시 한 번 정확히 복사해서 저장해 주세요!
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => router.push('/login')}
                        className="flex items-center justify-center gap-2 bg-amber-500 h-[56px] text-white font-black rounded-2xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 dark:shadow-none"
                    >
                        <RotateCcw size={18} />
                        다시 시도
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-dark-border h-[56px] text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                    >
                        <Home size={18} />
                        홈으로
                    </button>
                </div>
            </div>
        </div>
    )
}
