'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useModal } from '@/providers/ModalProvider'
import { translateError } from '@/lib/utils/error-translator'

interface SignupFormProps {
    onSuccess?: () => void
    onClose?: () => void
    onSwitchToLogin?: () => void
}

export default function SignupForm({ onSuccess, onClose, onSwitchToLogin }: SignupFormProps) {
    const router = useRouter()
    const { showError, showSuccess } = useModal()
    const [role, setRole] = useState<'USER' | 'EMPLOYER'>('USER')
    const [isLoading, setIsLoading] = useState(false)

    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        phone: '',
        agreeTerms: false,
        agreePrivacy: false,
        agreeSms: false,
    })

    const [shouldShake, setShouldShake] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target
        setForm(prev => ({
            ...prev,
            agreeTerms: checked,
            agreePrivacy: checked,
            agreeSms: checked
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.agreeTerms || !form.agreePrivacy || !form.agreeSms) {
            showError('필수 약관에 동의해 주세요. (SMS 수신 포함)')
            return
        }
        if (form.password !== form.confirmPassword) {
            setShouldShake(true)
            setTimeout(() => setShouldShake(false), 500)
            return
        }
        if (form.password.length < 6) {
            showError('비밀번호는 6자 이상이어야 합니다.')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email.includes('@') ? form.email : `${form.email}@elfalba.com`,
                    password: form.password,
                    username: form.nickname,
                    phone: form.phone || null,
                    role,
                    terms_agreed: form.agreeTerms,
                    privacy_agreed: form.agreePrivacy,
                    sms_consent: form.agreeSms
                }),
            })

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `가입 실패 (상태 코드: ${res.status})`);
            }

            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            })

            if (onSuccess) onSuccess()
            else window.location.href = '/'
            
            showSuccess('회원가입이 완료되었습니다!');
        } catch (err: any) {
            showError(translateError(err));
        } finally {
            setIsLoading(false)
        }
    }

    // ── Signup Form Screen ──
    return (
        <div className="relative pt-6 pb-12 px-8 bg-white dark:bg-dark-card animate-in fade-in duration-300">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors z-20"
                >
                    <X size={20} />
                </button>
            )}

            <div className="text-center mb-6 pt-4">
                <div className="text-amber-500 font-black text-3xl italic mb-4">엘프알바</div>
                <h1 className="text-[20px] font-black text-gray-900 dark:text-white tracking-tighter mb-1">회원가입</h1>
                <p className="text-[12px] text-amber-500 font-bold">거의 다 왔어요!</p>
            </div>

            <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-dark-bg rounded-2xl mb-6">
                <button
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${role === 'USER' ? 'bg-white dark:bg-dark-card text-amber-500 shadow-sm' : 'text-gray-400'}`}
                >
                    개인회원
                </button>
                <button
                    type="button"
                    onClick={() => setRole('EMPLOYER')}
                    className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${role === 'EMPLOYER' ? 'bg-white dark:bg-dark-card text-amber-500 shadow-sm' : 'text-gray-400'}`}
                >
                    기업회원
                </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <style jsx global>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                    .animate-shake {
                        animation: shake 0.2s ease-in-out infinite;
                        animation-iteration-count: 2;
                    }
                `}</style>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">아이디</label>
                    <input name="email" type="text" value={form.email} onChange={handleChange}
                        placeholder="아이디 입력" required
                        className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border focus:border-amber-300 outline-none text-[13px] font-bold dark:text-white" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className={shouldShake && form.password !== form.confirmPassword ? 'animate-shake' : ''}>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">비밀번호</label>
                        <input name="password" type="password" value={form.password} onChange={handleChange}
                            placeholder="6자 이상" required
                            className={`w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border outline-none text-[13px] font-bold dark:text-white ${shouldShake && form.password !== form.confirmPassword ? 'border-red-500' : 'border-gray-100 dark:border-dark-border focus:border-amber-300'}`} />
                    </div>
                    <div className={shouldShake && form.password !== form.confirmPassword ? 'animate-shake' : ''}>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">확인</label>
                        <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                            className={`w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border outline-none text-[13px] font-bold dark:text-white ${shouldShake && form.password !== form.confirmPassword ? 'border-red-500' : 'border-gray-100 dark:border-dark-border focus:border-amber-300'}`} />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">닉네임</label>
                            <input value={form.nickname} onChange={(e) => setForm(prev => ({ ...prev, nickname: e.target.value }))}
                                placeholder="닉네임 입력" required
                                className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-900 dark:text-white text-[13px] font-bold outline-none focus:border-amber-300 transition" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">휴대폰 (선택)</label>
                            <input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="예: 01012345678"
                                className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-900 dark:text-white text-[13px] font-bold outline-none focus:border-amber-300 transition" />
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-dark-border space-y-2">
                    <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl cursor-pointer">
                        <input type="checkbox" checked={form.agreeTerms && form.agreePrivacy && form.agreeSms} onChange={handleSelectAll} className="w-4 h-4 text-amber-500 rounded" />
                        <span className="text-[13px] font-black text-gray-700 dark:text-gray-200">약관 전체 동의</span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-amber-500 text-white rounded-xl font-black text-[15px] hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center shadow-md relative"
                >
                    {isLoading ? (
                         <div className="w-5 h-5 flex items-center justify-center">
                              <div className="w-full h-full border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         </div>
                    ) : '회원가입 완료'}
                </button>
            </form>

            <button
                onClick={onSwitchToLogin}
                className="w-full mt-6 text-[13px] text-gray-400 font-bold hover:text-amber-500 underline text-center"
            >
                이미 계정이 있으신가요?
            </button>
        </div>
    )
}
