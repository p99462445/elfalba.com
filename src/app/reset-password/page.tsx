'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, ShieldCheck, ArrowRight } from 'lucide-react'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) {
                alert(`오류: ${error.message}`)
            } else {
                setIsSuccess(true)
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            }
        } catch (err) {
            alert("알 수 없는 오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff5f6] to-white flex flex-col justify-center items-center p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(251,150,154,0.12)] border border-amber-50 relative overflow-hidden text-center">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100/50 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-50/50 rounded-full blur-3xl"></div>

                <div className="relative">
                    {!isSuccess ? (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                                    <KeyRound size={32} />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter">새 비밀번호 설정</h2>
                            <p className="text-sm text-gray-400 font-bold mb-10 leading-relaxed">
                                안전하게 사용하실 새로운 비밀번호를<br />
                                입력해 주세요.
                            </p>

                            <form className="space-y-6" onSubmit={handleResetPassword}>
                                <div className="space-y-4 text-left">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">새 비밀번호</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl p-4 text-[15px] font-bold focus:border-amber-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">비밀번호 확인</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl p-4 text-[15px] font-bold focus:border-amber-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-16 rounded-2xl font-black text-[16px] transition-all relative overflow-hidden group active:scale-95 shadow-xl ${isLoading
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#f59e0b] to-[#ffb1b5] text-white shadow-amber-100 hover:shadow-amber-200'
                                        }`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                변경 중...
                                            </>
                                        ) : '비밀번호 변경하기'}
                                    </span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="py-10 animate-in fade-in zoom-in duration-500">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-green-50 rounded-[30px] flex items-center justify-center text-green-500 shadow-sm border border-green-100 animate-bounce">
                                    <ShieldCheck size={40} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tighter">비밀번호 변경 완료!</h2>
                            <p className="text-[15px] text-gray-500 font-bold mb-10 leading-relaxed px-4">
                                비밀번호가 성공적으로 변경되었습니다.<br />
                                3초 후 로그인 화면으로 이동합니다.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-amber-500 font-black text-sm">
                                페이지 이동 중 <ArrowRight size={16} className="animate-pulse" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-8 text-[11px] text-gray-300 font-bold tracking-tight uppercase">
                Secure Account Protection · elfalba
            </p>
        </div>
    )
}
