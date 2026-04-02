'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ShieldCheck, ChevronRight, ChevronLeft, Phone, UserCheck } from 'lucide-react'

export default function VerificationModal() {
    const { showVerificationModal, setShowVerificationModal } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    if (!showVerificationModal) return null

    const handleVerify = () => {
        setIsLoading(true)
        // Simulate verification process
        setTimeout(() => {
            setIsLoading(false)
            setShowVerificationModal(false)
            router.push('/signup')
        }, 1200)
    }

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setShowVerificationModal(false)}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[360px] bg-white dark:bg-dark-card rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-5 fade-in duration-300">
                {/* Back Button */}
                <button
                    onClick={() => setShowVerificationModal(false)}
                    className="absolute top-5 left-5 p-2 text-gray-300 hover:text-amber-500 transition-colors z-10"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 group transition-all duration-300 hover:scale-110">
                        <ShieldCheck size={32} />
                    </div>

                    <h2 className="text-[20px] font-black leading-tight mb-2 tracking-tight text-gray-900 dark:text-gray-100">
                        본인 인증이 필요합니다
                    </h2>
                    <p className="text-[14px] text-gray-400 font-medium tracking-tight mb-8">
                        안전한 커뮤니티 활동을 위해<br />성인 인증이 필요합니다.
                    </p>

                    <div className="space-y-3">
                        {/* Fake Mobile Auth Option */}
                        <button
                            onClick={handleVerify}
                            disabled={isLoading}
                            className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-dark-bg hover:bg-amber-50 border border-gray-100 dark:border-dark-border hover:border-amber-200 rounded-2xl transition-all group disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-50 dark:border-dark-border flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition-colors">
                                    <Phone size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[14px] font-black text-gray-800 tracking-tight">휴대폰 본인인증</p>
                                    <p className="text-[11px] text-gray-400 font-bold">인증 단계로 이동합니다</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-amber-300 transition-colors" />
                        </button>

                        <button
                            onClick={handleVerify}
                            disabled={isLoading}
                            className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 border border-gray-100 dark:border-dark-border rounded-2xl transition-all group disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-50 dark:border-dark-border flex items-center justify-center text-gray-400 group-hover:text-gray-900 transition-colors">
                                    <UserCheck size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[14px] font-black text-gray-800 tracking-tight">PASS 인증서</p>
                                    <p className="text-[11px] text-gray-400 font-bold">간편하고 빠르게 인증</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </button>
                    </div>

                    <p className="mt-8 text-[11px] text-gray-300 font-medium">
                        본 단계는 회원가입을 위해 반드시 거쳐야 합니다.<br />
                        인증 후 가입 페이지로 바로 이동합니다!
                    </p>
                </div>

                {/* Loading HUD */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
                        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                        <p className="text-[13px] font-black text-amber-500">인증 중...</p>
                    </div>
                )}
            </div>
        </div>
    )
}
