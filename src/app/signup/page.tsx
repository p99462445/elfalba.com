'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SALARY_TYPE_LABEL: Record<string, string> = {
    TC: 'TC',
    HOURLY: '시급',
    DAILY: '일급',
    WEEKLY: '주급',
    MONTHLY: '월급',
    PER_CASE: '건당',
}

function formatSalary(salaryType: string, salaryAmount: number, salaryInfo?: string | null) {
    if (salaryInfo) return salaryInfo
    if (!salaryAmount || salaryAmount === 0) return '협의'
    const label = SALARY_TYPE_LABEL[salaryType] || salaryType
    return `${label} ${salaryAmount.toLocaleString()}원`
}

export { formatSalary, SALARY_TYPE_LABEL }

export default function SignupPage() {
    const router = useRouter()
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
            alert('필수 약관에 동의해 주세요. (SMS 수신 포함)')
            return
        }
        if (form.password !== form.confirmPassword) {
            setShouldShake(true)
            setTimeout(() => setShouldShake(false), 500)
            return
        }
        if (form.password.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.')
            return
        }

        setIsLoading(true)
        try {
            console.log('Sending signup request...');
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email.includes('@') ? form.email : `${form.email}@elfalba.com`,
                    password: form.password,
                    username: form.nickname,
                    phone: form.phone || null,
                    role,
                    // 약관 동의 내역 추가
                    terms_agreed: form.agreeTerms,
                    privacy_agreed: form.agreePrivacy,
                    sms_consent: form.agreeSms
                }),
            })

            let data;
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                console.error('Failed to parse JSON response:', text);
                throw new Error(`서버 응답 오류 (JSON 파싱 실패): ${res.status}`);
            }

            if (!res.ok) {
                throw new Error(data.error || `가입 실패 (상태 코드: ${res.status})`);
            }

            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            })

            if (signInError) {
                alert('회원가입은 완료되었으나, 자동 로그인에 실패하였습니다. 로그인 페이지로 이동합니다.');
                router.push('/login');
                return;
            }

            alert('회원가입이 완료되었습니다!');
            window.location.href = '/';
        } catch (err: any) {
            console.error('Signup form error:', err);
            if (err.message === 'Failed to fetch') {
                alert('서버 연결에 실패했습니다. (Failed to fetch)\n서버가 꺼져있거나 네트워크 연결을 확인해 주세요.');
            } else {
                alert(err.message);
            }
        } finally {
            setIsLoading(false)
        }
    }

    // ── 회원가입 폼 ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center py-10 px-4">
            <div className="relative w-full max-w-[400px] bg-white dark:bg-dark-card rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 dark:border-dark-border p-8">

                <div className="text-center mb-8">
                    {/* Logo Section */}
                    <Link href="/" className="mx-auto mb-5 flex items-center justify-center">
                        <div className="text-amber-500 font-black text-2xl italic tracking-tighter">엘프알바</div>
                    </Link>
                    <h1 className="text-[24px] font-black text-gray-900 dark:text-white tracking-tighter mb-1">회원가입</h1>
                    <p className="text-[13px] text-amber-500 font-bold">엘프알바의 특별한 혜택을 누려보세요!</p>
                </div>

                {/* 역할 선택 */}
                <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-dark-bg rounded-2xl mb-8">
                    <button
                        type="button"
                        onClick={() => setRole('USER')}
                        className={`flex-1 py-3 rounded-xl text-[13px] font-black transition-all ${role === 'USER' ? 'bg-white dark:bg-dark-card text-amber-500 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        개인회원
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('EMPLOYER')}
                        className={`flex-1 py-3 rounded-xl text-[13px] font-black transition-all ${role === 'EMPLOYER' ? 'bg-white dark:bg-dark-card text-amber-500 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        기업회원
                    </button>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
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

                    {/* 아이디 */}
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">아이디</label>
                        <input name="email" type="text" value={form.email} onChange={handleChange}
                            placeholder="사용하실 아이디를 입력해주세요" required
                            className="w-full h-13 px-5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border focus:border-amber-300 outline-none transition text-[14px] font-bold text-gray-900 dark:text-white" />
                    </div>

                    {/* 비밀번호 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={shouldShake && form.password !== form.confirmPassword ? 'animate-shake' : ''}>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">비밀번호</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange}
                                placeholder="6자 이상" required
                                className={`w-full h-13 px-5 rounded-2xl bg-gray-50 dark:bg-dark-bg border outline-none transition text-[14px] font-bold text-gray-900 dark:text-white ${shouldShake && form.password !== form.confirmPassword ? 'border-red-500' : 'border-gray-100 dark:border-dark-border focus:border-amber-300'}`} />
                        </div>
                        <div className={shouldShake && form.password !== form.confirmPassword ? 'animate-shake' : ''}>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">확인</label>
                            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                                placeholder="다시 입력" required
                                className={`w-full h-13 px-5 rounded-2xl bg-gray-50 dark:bg-dark-bg border outline-none transition text-[14px] font-bold text-gray-900 dark:text-white ${shouldShake && form.password !== form.confirmPassword ? 'border-red-500' : 'border-gray-100 dark:border-dark-border focus:border-amber-300'}`} />
                        </div>
                    </div>

                    <div className="pt-2 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">닉네임</label>
                                <input value={form.nickname} onChange={(e) => setForm(prev => ({ ...prev, nickname: e.target.value }))}
                                    placeholder="별명 혹은 상호명" required
                                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-900 dark:text-white text-[13px] font-bold outline-none focus:border-amber-300 transition" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">휴대폰 번호</label>
                                <input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="예: 01012345678"
                                    className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-900 dark:text-white text-[13px] font-bold outline-none focus:border-amber-300 transition" />
                            </div>
                        </div>
                    </div>

                    {/* 약관 동의 */}
                    <div className="pt-4 border-t border-gray-100 dark:border-dark-border space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl cursor-pointer border border-gray-100 dark:border-dark-border hover:border-amber-200 transition-colors">
                            <input
                                type="checkbox"
                                checked={form.agreeTerms && form.agreePrivacy && form.agreeSms}
                                onChange={handleSelectAll}
                                className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                            />
                            <span className="text-[14px] font-black text-gray-700 dark:text-gray-200">모든 약관에 전체 동의</span>
                        </label>

                        <div className="px-1 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input name="agreeTerms" type="checkbox" checked={form.agreeTerms} onChange={handleChange}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400" />
                                <span className="text-[12px] font-bold text-gray-400 group-hover:text-gray-600">이용약관 동의 (필수)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input name="agreePrivacy" type="checkbox" checked={form.agreePrivacy} onChange={handleChange}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400" />
                                <span className="text-[12px] font-bold text-gray-400 group-hover:text-gray-600">개인정보 처리방침 동의 (필수)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input name="agreeSms" type="checkbox" checked={form.agreeSms} onChange={handleChange}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400" />
                                <span className="text-[12px] font-bold text-gray-400 group-hover:text-gray-600">SMS 수신 동의 (필수)</span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-[16px] hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : '회원가입 완료'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-[13px] font-bold text-gray-400 hover:text-amber-500 transition">
                        이미 계정이 있으신가요? <span className="text-amber-500 underline">로그인</span>
                    </Link>
                </div>
            </div>

            <p className="mt-8 text-[11px] text-gray-300 dark:text-gray-700 font-bold tracking-tight">
                © {new Date().getFullYear()} ELFALBA. ALL RIGHTS RESERVED.
            </p>
        </div>
    )
}
