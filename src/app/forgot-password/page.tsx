'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Mail, Send, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const supabase = createClient()

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                alert(`오류: ${error.message}`)
            } else {
                setIsSubmitted(true)
            }
        } catch (err) {
            alert("알 수 없는 오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-[340px] bg-white dark:bg-dark-card rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 dark:border-dark-border text-center">

                <button
                    onClick={() => window.history.back()}
                    className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors z-10"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="relative pt-16 pb-12 px-8">
                    {!isSubmitted ? (
                        <>
                            {/* Logo Section */}
                            <div className="mx-auto mb-5 flex items-center justify-center">
                                <img
                                    src="/auth-logo.png"
                                    alt="엘프알바"
                                    className="w-48 h-auto object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div class="text-amber-500 font-black text-2xl italic">엘프알바</div>';
                                    }}
                                />
                            </div>

                            <h2 className="text-[22px] font-black leading-tight mb-3 tracking-tighter text-gray-900 dark:text-gray-100 break-keep">
                                비밀번호를<br />잊으셨나요?
                            </h2>
                            <p className="text-[14px] text-gray-400 font-black tracking-tight mb-8">
                                가입하신 이메일 주소로<br />재설정 링크를 보내드려요.
                            </p>

                            <form className="space-y-4" onSubmit={handleResetRequest}>
                                <div className="space-y-1">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border border rounded-2xl p-4 text-[14px] font-bold focus:border-amber-300 outline-none transition-all placeholder:text-gray-300 text-gray-900 dark:text-gray-100"
                                        placeholder="이메일 주소"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-[16px] hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200 dark:shadow-none"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            메일 발송하기
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="py-6 animate-in fade-in zoom-in duration-500">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-[24px] flex items-center justify-center text-green-500 shadow-sm border border-green-100 dark:border-green-900/30">
                                    <CheckCircle size={32} />
                                </div>
                            </div>
                            <h2 className="text-[20px] font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tighter">메일 발송 완료!</h2>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 font-bold mb-10 leading-relaxed px-2">
                                <span className="text-amber-500">{email}</span> 주소로<br />
                                비밀번호 재설정 링크가 발송되었습니다.
                            </p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full h-14 bg-gray-900 dark:bg-gray-100 text-white dark:text-dark-bg rounded-2xl font-black text-[15px] flex items-center justify-center hover:bg-black transition active:scale-95"
                            >
                                로그인으로 돌아가기
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-8 text-[11px] text-gray-300 dark:text-gray-700 font-bold tracking-tight">
                © {new Date().getFullYear()} BADALBA. ALL RIGHTS RESERVED.
            </p>
        </div>
    )
}
