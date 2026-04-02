'use client'
import React, { useState } from 'react'
import { ChevronLeft, Search, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ForgotIdPage() {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [foundEmail, setFoundEmail] = useState<string | null>(null)
    const router = useRouter()

    const handleFindId = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/find-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            })

            const data = await response.json()

            if (response.ok) {
                setFoundEmail(data.email)
            } else {
                alert(data.message || '일치하는 정보가 없습니다.')
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
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors z-10"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="relative pt-16 pb-12 px-8">
                    {!foundEmail ? (
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
                                아이디를<br />잊으셨나요?
                            </h2>
                            <p className="text-[14px] text-gray-400 font-black tracking-tight mb-8">
                                가입 시 입력한 이름과<br />휴대폰 번호를 입력해 주세요.
                            </p>

                            <form className="space-y-3" onSubmit={handleFindId}>
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border border rounded-2xl p-4 text-[14px] font-bold focus:border-amber-300 outline-none transition-all placeholder:text-gray-300 text-gray-900 dark:text-gray-100"
                                        placeholder="이름"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border border rounded-2xl p-4 text-[14px] font-bold focus:border-amber-300 outline-none transition-all placeholder:text-gray-300 text-gray-900 dark:text-gray-100"
                                        placeholder="휴대폰 번호 (- 제외)"
                                        required
                                    />
                                </div>

                                <div className="h-4" />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-[16px] hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200 dark:shadow-none"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Search size={18} />
                                            아이디 찾기
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="py-6 animate-in fade-in zoom-in duration-500">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-amber-50 dark:bg-pink-900/20 rounded-[24px] flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 dark:border-pink-900/30">
                                    <UserCheck size={32} />
                                </div>
                            </div>
                            <h2 className="text-[20px] font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tighter">아이디 발굴 성공!</h2>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 font-bold mb-8 leading-relaxed px-2">
                                고객님의 아이디는<br />
                                <span className="text-amber-500 text-lg">{foundEmail}</span> 입니다.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-[15px] flex items-center justify-center hover:bg-amber-600 transition active:scale-95"
                                >
                                    로그인 하기
                                </button>
                                <button
                                    onClick={() => router.push('/forgot-password')}
                                    className="w-full h-14 bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400 rounded-2xl font-black text-[14px] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-card transition active:scale-95"
                                >
                                    비밀번호 찾기
                                </button>
                            </div>
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
