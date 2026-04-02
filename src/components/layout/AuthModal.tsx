'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, X } from 'lucide-react'
import LoginForm from '../auth/LoginForm'
import SignupForm from '../auth/SignupForm'

export default function AuthModal() {
    const { user, showAuthModal, setShowAuthModal } = useAuth()
    const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('login')
    const router = useRouter()

    React.useEffect(() => {
        if (user && showAuthModal) {
            setShowAuthModal(false)
        }
    }, [user, showAuthModal, setShowAuthModal])

    // Reset mode when opening
    React.useEffect(() => {
        if (showAuthModal) {
            setMode('login')
        }
    }, [showAuthModal])

    if (!showAuthModal || user) return null

    const handleSuccess = () => {
        setShowAuthModal(false)
        // Profile refresh happens in AuthContext automatically due to onAuthStateChange
    }

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-[4px] animate-in fade-in duration-300"
                onClick={() => setShowAuthModal(false)}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-[360px] bg-white dark:bg-dark-card rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 border border-gray-100 dark:border-dark-border">

                {mode === 'landing' && (
                    <div className="relative pt-16 pb-12 px-8 text-center bg-white dark:bg-dark-card">
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="mx-auto mb-6 flex items-center justify-center h-12">
                            <div className="text-amber-500 font-black text-3xl italic">엘프알바</div>
                        </div>

                        <h2 className="text-[24px] font-black leading-tight mb-4 tracking-tighter text-gray-900 dark:text-gray-100 break-keep">
                            로그인을 하시면<br />모든 정보를 볼 수 있어요!
                        </h2>
                        <p className="text-[14px] text-gray-400 font-bold tracking-tight mb-10 leading-relaxed px-4">
                            엘프알바 정회원이 되어 <br />
                            검증된 구인구직 정보를 확인해보세요.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setMode('login')}
                                className="w-full h-15 bg-amber-500 text-white rounded-2xl font-black text-[16px] hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-amber-100 dark:shadow-none"
                            >
                                바로 로그인하기
                            </button>
                            <button
                                onClick={() => setMode('signup')}
                                className="w-full h-15 bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-[15px] hover:bg-gray-100 dark:hover:bg-dark-card transition-all active:scale-[0.98]"
                            >
                                무료 회원가입
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'login' && (
                    <LoginForm
                        onSuccess={handleSuccess}
                        onClose={() => setShowAuthModal(false)}
                        onSwitchToSignup={() => setMode('signup')}
                    />
                )}

                {mode === 'signup' && (
                    <SignupForm
                        onSuccess={handleSuccess}
                        onClose={() => setShowAuthModal(false)}
                        onSwitchToLogin={() => setMode('login')}
                    />
                )}
            </div>
        </div>
    )
}
