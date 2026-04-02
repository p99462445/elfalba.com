'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, X } from 'lucide-react'
import { useModal } from '@/providers/ModalProvider'
import { translateError } from '@/lib/utils/error-translator'

interface SignupFormProps {
    onSuccess?: () => void
    onClose?: () => void
    onSwitchToLogin?: () => void
}

export default function SignupForm({ onSuccess, onClose, onSwitchToLogin }: SignupFormProps) {
    const router = useRouter()
    const { showError, showSuccess, showAlert } = useModal()
    const [role, setRole] = useState<'USER' | 'EMPLOYER'>('USER')
    const [isVerified, setIsVerified] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [verifiedData, setVerifiedData] = useState<{ name: string; birthDate: string; gender: string; phone?: string } | null>(null)
    const [verificationToken, setVerificationToken] = useState<string | null>(null)

    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        birthday: '',
        phone: '',
        agreeTerms: false,
        agreePrivacy: false,
        agreeSms: false,
    })

    const [shouldShake, setShouldShake] = useState(false)

    // Handle verification result if redirected back from PortOne
    React.useEffect(() => {
        const checkVerificationResult = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const identityVerificationId = searchParams.get('identityVerificationId');
            const code = searchParams.get('code');
            
            if (identityVerificationId && !code) {
                // If we have an ID but no error code, it means we redirected back after success
                setIsLoading(true);
                try {
                    const verifyRes = await fetch("/api/auth/verify-identity", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ identityVerificationId }),
                    });

                    const result = await verifyRes.json();
                    if (!verifyRes.ok) throw new Error(result.message || '인증 검증 실패');

                    const { verifiedData: data, verificationToken: token } = result;
                    setVerifiedData(data);
                    setVerificationToken(token);
                    setForm(prev => ({
                        ...prev,
                        nickname: data.name,
                        birthday: data.birthDate,
                        phone: data.phone || '010-0000-0000',
                    }));
                    setIsVerified(true);
                    showSuccess('본인인증이 완료되었습니다.');
                    
                    // Clean up URL params
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (error: any) {
                    console.error('Redirect verification error:', error);
                    showError(`인증 검증 중 오류가 발생했습니다: ${translateError(error)}`);
                } finally {
                    setIsLoading(false);
                }
            } else if (code) {
                const message = searchParams.get('message');
                showError(`인증 실패: ${translateError(message || '알 수 없는 오류')}`);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };
        checkVerificationResult();
    }, []);

    const handleVerification = async (verifySuccessCallback?: (token: string) => void) => {
        try {
            // @ts-ignore
            if (typeof window.PortOne === 'undefined') {
                showError('본인인증 SDK를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
                return;
            }

            const identityVerificationId = `cert-${Date.now()}`;
            const redirectUrl = `${window.location.origin}/signup`;
            
            // Detect mobile
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // @ts-ignore
            const response = await window.PortOne.requestIdentityVerification({
                storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "",
                channelKey: "channel-key-ba75d8c6-64ac-4aff-907b-6204d1d0391e",
                identityVerificationId,
                redirectUrl,
                windowType: isMobile ? 'REDIRECT' : 'POPUP',
            });

            // If it's a popup (desktop), result comes back here
            if (!isMobile && response) {
                if (response.code != null) {
                    return showError(`인증 실패: ${translateError(response.message)}`);
                }

                setIsLoading(true);
                const verifyRes = await fetch("/api/auth/verify-identity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identityVerificationId }),
                });

                const result = await verifyRes.json();
                if (!verifyRes.ok) throw new Error(result.message || '인증 검증 실패');

                const { verifiedData: data, verificationToken: token } = result;
                setVerifiedData(data);
                setVerificationToken(token);
                setForm(prev => ({
                    ...prev,
                    nickname: data.name,
                    birthday: data.birthDate,
                    phone: data.phone || '010-0000-0000',
                }));
                setIsVerified(true);
                setIsLoading(false);

                if (verifySuccessCallback) {
                    verifySuccessCallback(token);
                } else {
                    showSuccess('본인인증이 완료되었습니다.');
                }
            }
            // If it's a redirect (mobile), the function execution stops here as the page navigates away

        } catch (error: any) {
            console.error('Verification error:', error);
            showError(`본인인증 과정에서 오류가 발생했습니다.\n상세: ${translateError(error)}`);
            setIsLoading(false);
        }
    }

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
                    verificationToken,
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

    // ── Adult Verification Screen ──
    if (!isVerified) {
        return (
            <div className="relative pt-6 pb-12 px-8 text-center bg-white dark:bg-dark-card animate-in fade-in duration-300">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors z-20"
                    >
                        <X size={20} />
                    </button>
                )}

                <div className="pt-8">
                    <div className="mx-auto w-[64px] h-[64px] border-[3px] border-amber-500 rounded-full flex items-center justify-center mb-6">
                        <span className="text-[24px] font-black text-gray-900 dark:text-white">19</span>
                    </div>

                    <h2 className="text-[22px] font-black tracking-tighter text-gray-900 dark:text-gray-100 mb-2">
                        성인인증이 필요해요
                    </h2>
                    <p className="text-[13px] text-gray-400 font-bold mb-10 leading-relaxed">
                        안전한 서비스 이용을 위해 <br />
                        본인인증을 진행해 주세요.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleVerification()}
                            className="w-full h-15 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-[16px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg"
                        >
                            휴대폰 본인인증
                        </button>

                        <button
                            onClick={() => {
                                handleVerification(async (token) => {
                                    const { createClient } = await import('@/lib/supabase/client')
                                    const supabase = createClient()
                                    document.cookie = `sb-verification-token=${token}; path=/; max-age=600; SameSite=Lax`;
                                    await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: { redirectTo: `${window.location.origin}/auth/callback` },
                                    })
                                });
                            }}
                            className="w-full h-15 bg-white dark:bg-dark-bg border-2 border-gray-100 dark:border-dark-border text-gray-800 dark:text-gray-100 rounded-2xl font-black text-[15px] flex items-center justify-center gap-3 hover:border-amber-500 transition-all active:scale-[0.98]"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            구글 1초 가입하기
                        </button>
                    </div>

                    <button
                        onClick={onSwitchToLogin}
                        className="mt-6 text-[13px] text-gray-400 font-bold hover:text-amber-500 underline"
                    >
                        이미 계정이 있으신가요?
                    </button>
                </div>
            </div>
        )
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
                <h1 className="text-[20px] font-black text-gray-900 tracking-tighter mb-1">회원가입</h1>
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
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">아이디</label>
                    <input name="email" type="text" value={form.email} onChange={handleChange}
                        placeholder="아이디 입력" required
                        className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border focus:border-amber-300 outline-none text-[13px] font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">비밀번호</label>
                        <input name="password" type="password" value={form.password} onChange={handleChange}
                            placeholder="6자 이상" required
                            className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border focus:border-amber-300 outline-none text-[13px] font-bold" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">확인</label>
                        <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                            className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border focus:border-amber-300 outline-none text-[13px] font-bold" />
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
                    className="w-full h-13 bg-amber-500 text-white rounded-xl font-black text-[15px] hover:bg-amber-600 transition-all shadow-md"
                >
                    {isLoading ? '발송 중...' : '회원가입 완료'}
                </button>
            </form>
        </div>
    )
}
