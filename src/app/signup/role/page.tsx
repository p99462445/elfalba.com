'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, User, Sparkles, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RoleSelectionPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()


    const [isVerified, setIsVerified] = useState(true)
    const [verificationData, setVerificationData] = useState<any>(null)
    const [verificationToken, setVerificationToken] = useState('')

    // Automatically trigger verification on mount
    React.useEffect(() => {
        const timer = setTimeout(() => {
            handleVerification()
        }, 800)
        return () => clearTimeout(timer)
    }, [])

    const handleVerification = async () => {
        try {
            // @ts-ignore
            if (typeof window.PortOne === 'undefined') return

            const identityVerificationId = `cert-${Date.now()}`
            const redirectUrl = `${window.location.origin}/signup/role`

            // @ts-ignore
            const response = await window.PortOne.requestIdentityVerification({
                storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "",
                channelKey: "channel-key-ba75d8c6-64ac-4aff-907b-6204d1d0391e",
                identityVerificationId,
                redirectUrl,
            })

            if (response.code != null) return

            // Verify on server
            const verifyRes = await fetch("/api/auth/verify-identity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identityVerificationId }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.error || "본인인증 실패")

            setVerificationToken(verifyData.token)
            setVerificationData(verifyData.data)
            setIsVerified(true)

        } catch (error) {
            console.error('Verification error:', error)
        }
    }

    const handleRoleSelect = async (role: 'USER' | 'EMPLOYER') => {
        if (!isVerified) {
            alert('먼저 본인인증을 완료해 주세요.')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, verificationToken }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || '역할 설정에 실패했습니다.')
            }

            router.push(role === 'EMPLOYER' ? '/employer' : '/')
        } catch (err: any) {
            alert(err.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
            <script src="https://cdn.portone.io/v2/browser-sdk.js" async></script>
            <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-1000">

                    <div className="mx-auto mb-10 flex items-center justify-center">
                        <div className="text-amber-500 font-black text-5xl italic tracking-tighter">엘프알바</div>
                    </div>

                    <div className="space-y-6 animate-in fade-in zoom-in duration-1000 delay-300">
                        <p className="text-[17px] sm:text-[19px] font-black text-white leading-tight tracking-tight drop-shadow-lg">
                            모델·방송 구인구직의 새로운 시작 <br />
                            <span className="text-amber-500">엘프알바에 오신 것을 환영합니다! ✨</span>
                        </p>
                    </div>

                    <div className="space-y-6 animate-in zoom-in-95 duration-700">
                        <div className="text-center mb-10">
                            <p className="text-[17px] font-black text-white tracking-tight">누구로 활동하시겠어요?</p>
                        </div>

                        {/* Role Cards */}
                        <div className="grid grid-cols-2 gap-5">
                            <button
                                onClick={() => handleRoleSelect('EMPLOYER')}
                                disabled={isLoading}
                                className="group relative bg-[#111111] border-2 border-[#222222] rounded-[40px] p-8 text-center hover:border-amber-500 transition-all duration-500 hover:bg-[#1a1a1a] shadow-xl"
                            >
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:rotate-6 duration-500">
                                    <Briefcase size={32} />
                                </div>
                                <h3 className="text-[18px] font-black text-white group-hover:text-amber-500 transition-colors">기업회원</h3>
                            </button>
                            <button
                                onClick={() => handleRoleSelect('USER')}
                                disabled={isLoading}
                                className="group relative bg-[#111111] border-2 border-[#222222] rounded-[40px] p-8 text-center hover:border-amber-500 transition-all duration-500 hover:bg-[#1a1a1a] shadow-xl"
                            >
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:-rotate-6 duration-500">
                                    <User size={32} />
                                </div>
                                <h3 className="text-[18px] font-black text-white group-hover:text-amber-500 transition-colors">개인회원</h3>
                            </button>
                        </div>
                    </div>

                <div className="mt-12 text-center">
                    <p className="text-[11px] text-gray-300 dark:text-gray-700 font-bold">
                        © {new Date().getFullYear()} BADALBA. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    )
}
