'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useModal } from '@/providers/ModalProvider'
import { translateError } from '@/lib/utils/error-translator'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberEmail, setRememberEmail] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Migration states
    const [idForMigrate, setIdForMigrate] = useState<string | null>(null)
    const [birthdate, setBirthdate] = useState('')
    const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false)
    const [requiresManual, setRequiresManual] = useState(false)

    // Custom Success Modal state
    const [successModal, setSuccessModal] = useState<{
        isOpen: boolean;
        message: string;
        redirectUrl: string;
        isTempPassword?: boolean;
        email?: string;
        password?: string;
    }>({ isOpen: false, message: '', redirectUrl: '/' })

    const router = useRouter()
    const supabase = createClient()
    const { showError, showSuccess, showAlert } = useModal()

    // Load remembered email
    React.useEffect(() => {
        const savedEmail = localStorage.getItem('elfalba_remember_email')
        if (savedEmail) {
            setEmail(savedEmail)
            setRememberEmail(true)
        }
    }, [])



    const handleMigrate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: idForMigrate, 
                    birthdate: birthdate.trim(),
                    password: password 
                })
            })

            const data = await res.json()

            if (res.ok) {
                setIsMigrationModalOpen(false)

                // [STEP 2: DELAY LOGIN] Show Success Modal first, login ONLY after confirm
                const loginPwd = data.password || (password.length < 6 ? '123123' : password)
                
                setSuccessModal({
                    isOpen: true,
                    message: data.message || '이사 성공!',
                    redirectUrl: (data.isTempPassword || password.length < 6) ? '/profile' : '/',
                    isTempPassword: !!(data.isTempPassword || password.length < 6),
                    email: data.email,
                    password: loginPwd
                })
            } else {
                showError(data.message || '이사 중 오류가 발생했습니다.')
            }
        } catch (err) {
            showError('이사 요청 중 알 수 없는 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuccessConfirm = async () => {
        setIsLoading(true)
        try {
            // [STEP 3: FINAL LOGIN] Perform login only when user clicks "Confirm" on Success Modal
            if (successModal.email && successModal.password) {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: successModal.email,
                    password: successModal.password
                })
                if (loginError) throw loginError;
            }

            window.location.href = successModal.redirectUrl
        } catch (err) {
            console.error('Final login failed:', err)
            showError('로그인 처리 중 문제가 발생했습니다. 대표번호(1899-0930)로 문의바랍니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        if (e) e.preventDefault()
        setIsLoading(true)

        try {
            const loginEmail = email.includes('@') ? email : `${email}@elfalba.com`
            
            // [CHECK 1: Short Password] 
            // If password < 6, Supabase will reject it regardless. 
            // We treat this as a signal for legacy migration/activation check.
            if (password.length < 6) {
                console.log('[DEBUG] Short password detected. Checking for legacy/activation status...');
                const legacyRes = await fetch('/api/auth/legacy-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: email })
                })
                const legacyData = await legacyRes.json()

                if (legacyRes.ok && legacyData.isLegacy) {
                    setIdForMigrate(email)
                    setRequiresManual(!!legacyData.requiresManualAdmin)
                    setIsMigrationModalOpen(true)
                    setIsLoading(false)
                    return
                }
            }

            // [CHECK 2: Normal Login]
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            })

            if (error) {
                // If login fails, it might still be a legacy member who hasn't activated yet 
                // but has a password length >= 6.
                if (error.message === 'Invalid login credentials' || error.message.includes('Invalid login')) {
                    const legacyRes = await fetch('/api/auth/legacy-check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: email })
                    })
                    const legacyData = await legacyRes.json()

                    if (legacyRes.ok && legacyData.isLegacy) {
                        setIdForMigrate(email)
                        setRequiresManual(!!legacyData.requiresManualAdmin)
                        setIsMigrationModalOpen(true)
                        setIsLoading(false)
                        return
                    }

                    showError('아이디 또는 비밀번호가 일치하지 않습니다.')
                } else if (error.message.includes('Email not confirmed')) {
                    showError('이메일 인증이 완료되지 않았습니다.')
                } else {
                    showError(`오류: ${translateError(error)}`)
                }

                setIsLoading(false)
                return
            }

            if (rememberEmail) localStorage.setItem('elfalba_remember_email', email)
            else localStorage.removeItem('elfalba_remember_email')

            const profileRes = await fetch('/api/auth/profile')
            const profileData = await profileRes.json()

            if (profileRes.ok) {
                const userRole = profileData.user?.role
                if (userRole === 'ADMIN') window.location.href = '/admin'
                else if (userRole === 'EMPLOYER') window.location.href = '/employer'
                else window.location.href = '/'
            } else {
                window.location.href = '/'
            }
        } catch (err) {
            showError("알 수 없는 오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-start p-4 pt-12 md:justify-center">
            <div className="relative w-full max-w-[340px] bg-white dark:bg-dark-card rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 dark:border-dark-border">

                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors z-10"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="relative pt-6 pb-12 px-8 text-center">
                    <div className="mx-auto mb-4 flex items-center justify-center">
                        <div className="text-amber-500 font-black text-2xl italic tracking-tighter">엘프알바</div>
                    </div>

                    <h2 className="text-[20px] font-black leading-tight mb-6 tracking-tighter text-gray-900 dark:text-gray-100 break-keep">
                        반가워요!<br />로그인 해주세요
                    </h2>

                    <form className="space-y-3" onSubmit={handleLogin}>
                        <div className="space-y-1">
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                                className="w-full bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border border rounded-2xl p-4 text-[14px] font-bold focus:border-amber-300 outline-none transition-all placeholder:text-gray-300 text-gray-900 dark:text-gray-100"
                                placeholder="아이디"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                                className="w-full bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border border rounded-2xl p-4 text-[14px] font-bold focus:border-amber-300 outline-none transition-all placeholder:text-gray-300 text-gray-900 dark:text-gray-100"
                                placeholder="비밀번호"
                                required
                            />
                        </div>

                        <div className="flex justify-center items-center gap-3 px-1 pt-2 pb-2">
                            <Link href="/forgot-id" className="text-[11px] font-bold text-gray-400 hover:text-amber-500 transition">아이디 찾기</Link>
                            <span className="w-px h-2 bg-gray-200 dark:bg-dark-border" />
                            <Link href="/forgot-password" className="text-[11px] font-bold text-gray-400 hover:text-amber-500 transition">비밀번호 찾기</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                                className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-[16px] hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : '로그인'}
                        </button>


                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-border flex flex-col items-center gap-3">
                        <p className="text-[13px] text-amber-500 font-bold">엘프알바의 특별한 혜택을 누려보세요!</p>
                        <p className="text-[13px] text-gray-400 dark:text-gray-500 font-bold">아직 회원이 아니신가요?</p>
                        <Link
                            href="/signup"
                            className="w-full h-14 bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-400 rounded-2xl font-black text-[15px] flex items-center justify-center hover:bg-gray-100 dark:hover:hover:bg-dark-card transition-all"
                        >
                            회원가입
                        </Link>
                    </div>
                </div>
            </div>

            {/* Legacy Migration Modal */}
            {isMigrationModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-dark-card w-full max-w-[320px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 pt-8 pb-6 text-center">
                            <div className="mx-auto mb-6 flex items-center justify-center">
                                <img
                                    src="/auth-logo.png"
                                    alt="엘프알바"
                                    className="w-32 h-auto object-contain"
                                />
                            </div>

                            <h3 className="text-[19px] font-black text-gray-900 dark:text-gray-100 mb-2 leading-tight tracking-tight">
                                다시 만나서 기뻐요, <span className="text-amber-500">{idForMigrate}</span> 사장님!
                            </h3>

                            {requiresManual ? (
                                <div className="space-y-4 pt-2">
                                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                        엘프알바가 새롭게 단장했습니다.<br />
                                        정보가 부족하여 자동 연결이 어렵습니다.<br />
                                        카톡으로 문의주시면 즉시 해결해 드릴게요!
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsMigrationModalOpen(false)}
                                            className="flex-1 h-14 bg-gray-100 dark:bg-dark-bg text-gray-400 rounded-2xl font-bold text-[15px] hover:bg-gray-200"
                                        >
                                            취소
                                        </button>
                                        <a
                                            href="https://pf.kakao.com/elfalba1/chat"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-[2] h-14 bg-[#FEE500] text-[#191919] rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 hover:bg-[#F7D600] active:scale-[0.98] transition-all"
                                        >
                                            💬 카톡 문의하기
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-4 whitespace-pre-line leading-relaxed">
                                        엘프알바가 새롭게 단장했습니다.<br />
                                        기존 정보 연결을 위해<br />
                                        생년월일을 확인해 주세요.
                                    </p>

                                    <form onSubmit={handleMigrate} className="space-y-4 pt-2">
                                        <div className="space-y-1 text-left">
                                            <label className="text-[11px] font-bold text-gray-400 ml-1">생년월일 (예: 021108)</label>
                                            <input
                                                type="text"
                                                maxLength={8}
                                                value={birthdate}
                                                onChange={(e) => setBirthdate(e.target.value)}
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                spellCheck="false"
                                                className="w-full bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-border border rounded-2xl p-4 text-center text-[18px] font-black tracking-[0.2em] focus:border-amber-300 outline-none transition-all placeholder:text-gray-200"
                                                placeholder="000000"
                                                required
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsMigrationModalOpen(false)}
                                                className="flex-1 h-14 bg-gray-100 dark:bg-dark-bg text-gray-400 rounded-2xl font-bold text-[15px] hover:bg-gray-200"
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-[2] h-14 bg-amber-500 text-white rounded-2xl font-black text-[15px] hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-none"
                                            >
                                                {isLoading ? '연결 중...' : '확인'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Success Modal */}
            {successModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[500] animate-in fade-in duration-300">
                    <div className="bg-[#1A1A1A] w-full max-w-[320px] rounded-[40px] overflow-hidden shadow-2xl p-8 text-center border border-white/5 animate-in zoom-in-95 duration-300">
                        <div className="mx-auto mb-6 flex items-center justify-center">
                            <div className="text-amber-500 font-black text-4xl italic">엘프알바</div>
                        </div>
                        
                        <h3 className="text-[20px] font-black text-white mb-4 leading-tight tracking-tight">
                            🎊 연동 완료!
                        </h3>

                        <div className="text-[14px] font-medium text-gray-400 mb-8 leading-relaxed whitespace-pre-wrap break-keep">
                            {successModal.isTempPassword ? (
                                <>
                                    신규홈페이지 연동 완료!<br />
                                    비밀번호 <span className="text-amber-500 font-black">123123</span> 으로<br />
                                    <span className="text-amber-500 font-black text-[15px]">임시변경되었습니다!</span><br />
                                    반드시 변경해주세요!
                                </>
                            ) : (
                                "더 좋은 서비스로 보답하겠습니다!"
                            )}
                        </div>

                        <button 
                            onClick={handleSuccessConfirm}
                            className="w-full h-15 bg-amber-500 hover:bg-amber-600 active:scale-[0.97] text-white rounded-[24px] font-black text-[17px] transition-all shadow-lg shadow-amber-500/20"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

            <p className="mt-8 text-[11px] text-gray-300 dark:text-gray-700 font-bold tracking-tight">
                © {new Date().getFullYear()} ELFALBA. ALL RIGHTS RESERVED.
            </p>
        </div>
    )
}
