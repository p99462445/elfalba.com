'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useModal } from '@/providers/ModalProvider'
import { translateError } from '@/lib/utils/error-translator'

interface LoginFormProps {
    onSuccess?: () => void
    onClose?: () => void
    onSwitchToSignup?: () => void
}

export default function LoginForm({ onSuccess, onClose, onSwitchToSignup }: LoginFormProps) {
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
                    redirectUrl: (data.isTempPassword || password.length < 6) ? '/profile' : (onSuccess ? 'CALLBACK' : '/'),
                    isTempPassword: !!(data.isTempPassword || password.length < 6),
                    email: data.email,
                    password: loginPwd
                })
            } else {
                showError(data.message || '이사 중 오류가 발생했습니다. 대표번호(1899-0930)로 문의바랍니다.')
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

            if (successModal.redirectUrl === 'CALLBACK') {
                if (onSuccess) onSuccess()
            } else {
                window.location.href = successModal.redirectUrl
            }
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
            
            // [HARD BYPASS] If password is too short, we MUST show migration modal and STOP everything else.
            // This bypasses even the signOut()/signIn() logic to ensure the modal stays visible.
            if (password.length < 6) {
                console.log('[DEBUG] Short password < 6 detected. Priority: Migration Modal.');
                
                const legacyRes = await fetch('/api/auth/legacy-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: email })
                })
                const legacyData = await legacyRes.json()

                if (legacyRes.ok && legacyData.isLegacy) {
                    console.log('[DEBUG] Legacy member confirmed. Opening modal for:', email);
                    setIdForMigrate(email)
                    setRequiresManual(!!legacyData.requiresManualAdmin)
                    setIsMigrationModalOpen(true)
                    setIsLoading(false)
                    return; // EXIT IMMEDIATELY - DO NOT PROCEED TO LOGIN
                } else {
                    console.log('[DEBUG] Not a legacy member. Showing standard error.');
                    showError('아이디 또는 비밀번호가 일치하지 않습니다.');
                    setIsLoading(false)
                    return;
                }
            }

            // [STANDARD LOGIN] Only proceeds if password is 6+ characters
            await supabase.auth.signOut({ scope: 'local' });
            
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            })

            if (error) {
                if (error.message === 'Invalid login credentials' || error.message.includes('Database error')) {
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
                if (onSuccess) onSuccess()
                else {
                    const userRole = profileData.user?.role
                    if (userRole === 'ADMIN') window.location.href = '/admin'
                    else if (userRole === 'EMPLOYER') window.location.href = '/employer'
                    else window.location.href = '/'
                }
            } else {
                if (onSuccess) onSuccess()
                else window.location.href = '/'
            }
        } catch (err) {
            showError("알 수 없는 오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative pt-2 pb-12 px-8 text-center bg-white dark:bg-dark-card animate-in fade-in duration-300">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors z-20"
                >
                    <X size={20} />
                </button>
            )}

            <div className="mx-auto mb-4 mt-2 flex items-center justify-center h-10">
                <div className="text-amber-500 font-black text-2xl italic">엘프알바</div>
            </div>

            <h2 className="text-[18px] font-black leading-tight mb-4 tracking-tighter text-gray-900 dark:text-gray-100 break-keep">
                로그인 하시면<br />모든 정보를 볼 수 있어요!
            </h2>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 mb-6">
                <p className="text-[13px] font-black text-amber-600 dark:text-amber-400">
                    심사용 테스트 아이디: <span className="underline select-all text-gray-900 dark:text-gray-100">1@1.com</span> / 비번: <span className="underline select-all text-gray-900 dark:text-gray-100">123123</span>
                </p>
                <p className="text-[11px] font-bold text-amber-500 mt-1 opacity-80">로그인하면 모든정보를 볼수있어요 !</p>
            </div>

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
                    <button type="button" onClick={() => router.push('/forgot-id')} className="text-[11px] font-bold text-gray-400 hover:text-amber-500 transition">아이디 찾기</button>
                    <span className="w-px h-2 bg-gray-200 dark:bg-dark-border" />
                    <button type="button" onClick={() => router.push('/forgot-password')} className="text-[11px] font-bold text-gray-400 hover:text-amber-500 transition">비밀번호 찾기</button>
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

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-border flex flex-col items-center gap-2">
                <p className="text-[12px] text-gray-400 dark:text-gray-500 font-bold">아직 회원이 아니신가요?</p>
                <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="w-full h-14 bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-400 rounded-2xl font-black text-[15px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-card transition-all"
                >
                    회원가입
                </button>
            </div>

            {/* Legacy Migration Modal */}
            {isMigrationModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-dark-card w-full max-w-[300px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className="mx-auto mb-4 flex items-center justify-center">
                            <img src="/auth-logo.png" alt="엘프알바" className="w-32 h-auto object-contain" />
                        </div>
                        <h3 className="text-[17px] font-black text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                            다시 만나서 기뻐요, <span className="text-amber-500">{idForMigrate}</span> 사장님!
                        </h3>

                        {requiresManual ? (
                            <div className="space-y-4 pt-2">
                                <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                                    정보 연결을 위해 카톡 문의 부탁드려요!
                                </p>
                                <a
                                    href="https://pf.kakao.com/elfalba1/chat"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full h-12 bg-[#FEE500] text-[#191919] rounded-xl font-black text-[14px] flex items-center justify-center gap-2"
                                >
                                    카톡 문의하기
                                </a>
                                <button onClick={() => setIsMigrationModalOpen(false)} className="text-[12px] text-gray-400 font-bold">취소</button>
                            </div>
                        ) : (
                            <form onSubmit={handleMigrate} className="space-y-4 pt-2">
                                <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    기존 정보 연결을 위해<br />생년월일을 확인해 주세요.
                                </p>
                                <input
                                    type="text"
                                    maxLength={8}
                                    value={birthdate}
                                    onChange={(e) => setBirthdate(e.target.value)}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-3 text-center text-[16px] font-black tracking-widest outline-none"
                                    placeholder="000000"
                                    required
                                />
                                <div className="flex gap-2 text-sm font-bold">
                                    <button type="button" onClick={() => setIsMigrationModalOpen(false)} className="flex-1 h-12 bg-gray-100 dark:bg-dark-bg text-gray-400 rounded-xl">취소</button>
                                    <button type="submit" disabled={isLoading} className="flex-1 h-12 bg-amber-500 text-white rounded-xl">확인</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Success Modal */}
            {successModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[500] animate-in fade-in duration-300">
                    <div className="bg-[#1A1A1A] w-full max-w-[320px] rounded-[40px] overflow-hidden shadow-2xl p-8 text-center border border-white/5 animate-in zoom-in-95 duration-300">
                        <div className="mx-auto mb-6 flex items-center justify-center">
                            <img src="/auth-logo.png" alt="엘프알바" className="w-40 h-auto object-contain brightness-110" />
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
        </div>
    )
}
