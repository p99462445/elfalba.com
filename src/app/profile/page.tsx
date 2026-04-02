'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, User, Lock, Save, Settings, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/providers/ModalProvider'
import { translateError } from '@/lib/utils/error-translator'

export default function ProfilePage() {
    const router = useRouter()
    const supabase = createClient()
    const { refreshProfile } = useAuth()
    const { showError, showSuccess, showConfirm } = useModal()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [userRole, setUserRole] = useState<string>('USER')
    const [showUpgradeForm, setShowUpgradeForm] = useState(false)
    const [isUpgrading, setIsUpgrading] = useState(false)
    const [upgradeForm, setUpgradeForm] = useState({
        business_name: '',
        business_number: '',
        address: '',
        owner_name: '',
        phone: ''
    })

    const [form, setForm] = useState({
        nickname: '',
        businessName: '',
        email: '',
        password: '',
        passwordConfirm: ''
    })

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                showError('로그인이 필요합니다.')
                router.push('/login')
                return
            }
            // Fetch role from DB
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    setUserRole(data.role || 'USER')
                    setForm(prev => ({
                        ...prev,
                        email: user.email || '',
                        nickname: data.nickname || user.user_metadata?.nickname || '',
                        businessName: data.businessName || ''
                    }))
                }
            } catch { } finally {
                setIsLoading(false)
            }
        }
        fetchUser()
    }, [router, supabase.auth])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (form.password && form.password !== form.passwordConfirm) {
            showError('비밀번호가 일치하지 않습니다.')
            return
        }

        setIsSaving(true)
        try {
            // Update via our new API
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: form.nickname
                })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Update failed')
            }

            // Update password via Supabase if provided
            if (form.password) {
                const { error } = await supabase.auth.updateUser({ password: form.password })
                if (error) throw error
            }

            // Trigger global profile refresh
            await refreshProfile()

            showSuccess('정보가 성공적으로 수정되었습니다.')
            if (form.password) {
                setForm(prev => ({ ...prev, password: '', passwordConfirm: '' }))
            }
        } catch (error: any) {
            showError('오류가 발생했습니다: ' + translateError(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpgrade = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!upgradeForm.business_name.trim()) {
            showError('상호명을 입력해 주세요.')
            return
        }
        
        showConfirm('업소(기업) 회원으로 전환하시겠습니까?\n전환 후 구직자 커뮤니티 이용이 제한되며, 공고 등록이 가능해집니다.', async () => {
            setIsUpgrading(true)
            try {
                const res = await fetch('/api/user/upgrade-to-employer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(upgradeForm)
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)
                showSuccess('업소 회원으로 전환되었습니다!\n다시 로그인해 주세요.', async () => {
                    await supabase.auth.signOut()
                    router.push('/login')
                })
            } catch (err: any) {
                showError('오류: ' + translateError(err))
            } finally {
                setIsUpgrading(false)
            }
        })
    }

    const handleWithdraw = async () => {
        showConfirm('정말로 탈퇴하시겠습니까? 탈퇴 후에도 작성하신 정보는 DB에 보관되지만, 계정은 즉시 삭제되며 로그아웃 처리됩니다.', () => {
            showConfirm('다시 한번 확인합니다. 정말로 삭제하시겠습니까? 다시는 되돌릴 수 없습니다.', async () => {
                setIsSaving(true)
                try {
                    const res = await fetch('/api/auth/withdraw', { method: 'POST' })
                    const data = await res.json()

                    if (!res.ok) throw new Error(data.error || '탈퇴 처리 실패')

                    showSuccess('탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.', async () => {
                        await supabase.auth.signOut()
                        router.push('/')
                    })
                } catch (error: any) {
                    showError('오류: ' + translateError(error))
                } finally {
                    setIsSaving(false)
                }
            })
        })
    }

    if (isLoading) {
        return <div className="min-h-screen flex text-center justify-center p-20 font-bold text-gray-400 dark:text-gray-500">불러오는 중...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-20">
            {/* Sticky Header - Unified Style */}
            <div className="w-full bg-white dark:bg-dark-card border-b border-gray-50 dark:border-dark-border sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.back()} className="text-gray-900 dark:text-gray-100 p-2 -ml-2 mr-0.5 hover:text-gray-900 transition active:scale-95">
                            <ChevronLeft size={24} />
                        </button>
                        <Settings size={18} className="text-amber-500" />
                        <h1 className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">내 정보 설정</h1>
                    </div>
                </div>
            </div>

            <main className="p-4 max-w-lg mx-auto mt-4 space-y-6">

                {/* Profile Image Area */}
                <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-gray-100 dark:border-dark-border shadow-soft flex items-center gap-5">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-dark-bg rounded-2xl flex items-center justify-center relative border-2 border-white dark:border-dark-border shadow-sm flex-shrink-0">
                        <div className="text-xl font-black text-amber-500">
                            {(userRole === 'EMPLOYER' ? (form.businessName?.[0] || '업') : (form.nickname?.[0] || '회'))}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-black text-gray-900 dark:text-gray-100 text-[18px] truncate">
                                {(form.nickname || form.businessName || '회원')}님
                            </p>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-tight ${userRole === 'EMPLOYER' ? 'bg-blue-500 text-white' :
                                userRole === 'ADMIN' ? 'bg-purple-500 text-white' :
                                    'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400'
                                }`}>
                                {userRole === 'EMPLOYER' ? '업소회원' : userRole === 'ADMIN' ? '관리자' : '개인회원'}
                            </span>
                        </div>
                        <p className="text-[13px] font-bold text-gray-400 dark:text-gray-500 truncate tracking-tight">
                            {form.email.endsWith('@elfalba.com') ? form.email.replace('@elfalba.com', '') : form.email}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-gray-100 dark:border-dark-border shadow-soft space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">기본 정보</h2>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 pl-2">아이디 <span className="text-gray-400 dark:text-gray-500 font-normal">(변경불가)</span></label>
                            <input
                                type="email"
                                value={form.email.endsWith('@elfalba.com') ? form.email.replace('@elfalba.com', '') : form.email}
                                disabled
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border px-4 py-3.5 rounded-2xl text-gray-400 font-bold outline-none"
                            />
                        </div>

                        {/* 닉네임 / 상호명 입력 칸 복구 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 pl-2">
                                활동 닉네임 / 활동명 <span className="text-gray-400 dark:text-gray-500 font-normal">(채팅 시 노출)</span>
                            </label>
                            <input
                                type="text"
                                name="nickname"
                                value={form.nickname || ''}
                                onChange={handleChange}
                                placeholder="사용하실 닉네임을 입력하세요"
                                className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border px-4 py-3.5 rounded-2xl text-gray-900 dark:text-gray-100 font-bold outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-50 transition-all dark:focus:ring-pink-950/20"
                            />
                            {userRole === 'EMPLOYER' && (
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold pl-2">
                                    * 공식 사업자명(공고용)은 <Link href="/employer/business" className="text-blue-400 underline decoration-blue-200">사업자 정보 설정</Link>에서 수정 가능합니다.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-dark-border">
                        <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <Lock size={14} /> 비밀번호 변경
                        </h2>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 pl-2">새 비밀번호</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="변경할 경우에만 입력하세요"
                                className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border px-4 py-3.5 rounded-2xl text-gray-900 dark:text-gray-100 font-bold outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-50 transition-all dark:focus:ring-pink-950/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 pl-2">새 비밀번호 확인</label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={form.passwordConfirm}
                                onChange={handleChange}
                                placeholder="비밀번호를 한번 더 입력하세요"
                                className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border px-4 py-3.5 rounded-2xl text-gray-900 dark:text-gray-100 font-bold outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-50 transition-all dark:focus:ring-pink-950/20"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-[#f59e0b] hover:bg-[#FF337A] text-white font-black py-4 rounded-2xl transition-all shadow-md mt-4 disabled:opacity-50 flex justify-center items-center gap-2 text-lg active:scale-95"
                    >
                        <Save size={20} />
                        {isSaving ? '저장 중...' : '설정 저장하기'}
                    </button>
                </form>

                {/* 업주 전환 섹션 - USER만 표시 */}
                {userRole === 'USER' && (
                    <div className="bg-white dark:bg-dark-card rounded-3xl border border-blue-100 dark:border-dark-border shadow-soft overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowUpgradeForm(!showUpgradeForm)}
                            className="w-full p-6 flex items-center justify-between hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center">
                                    <Building2 size={20} className="text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">업소(기업) 회원으로 전환</p>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500">공고 등록 및 구인 활동이 가능해집니다</p>
                                </div>
                            </div>
                            {showUpgradeForm ? <ChevronUp size={18} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={18} className="text-gray-400 dark:text-gray-500" />}
                        </button>

                        {showUpgradeForm && (
                            <form onSubmit={handleUpgrade} className="px-6 pb-6 space-y-4 border-t border-blue-50 dark:border-dark-border">
                                <p className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 rounded-xl px-4 py-3 mt-4">
                                    ⚠️ 전환 후 다시 개인 회원으로 변경하려면 관리자에게 문의해야 합니다.
                                </p>
                                {[
                                    { name: 'business_name', label: '상호명 (필수)', placeholder: '업소 이름을 입력하세요' },
                                    { name: 'business_number', label: '사업자 등록번호', placeholder: '000-00-00000' },
                                    { name: 'owner_name', label: '대표자명', placeholder: '대표자 실명' },
                                    { name: 'phone', label: '업소 연락처', placeholder: '010-0000-0000' },
                                    { name: 'address', label: '업소 주소', placeholder: '상세 주소 입력' },
                                ].map(field => (
                                    <div key={field.name} className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 pl-2">{field.label}</label>
                                        <input
                                            type="text"
                                            value={(upgradeForm as any)[field.name]}
                                            onChange={e => setUpgradeForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border px-4 py-3.5 rounded-2xl text-gray-900 dark:text-gray-100 font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all dark:focus:ring-blue-950/20"
                                        />
                                    </div>
                                ))}
                                <button
                                    type="submit"
                                    disabled={isUpgrading}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2 mt-2 active:scale-95"
                                >
                                    <Building2 size={20} />
                                    {isUpgrading ? '처리 중...' : '업소 회원으로 전환하기'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* 탈퇴하기 섹션 */}
                <div className="pt-10 flex flex-col items-center">
                    <button
                        onClick={handleWithdraw}
                        disabled={isSaving}
                        className="text-xs font-bold text-gray-300 hover:text-red-400 underline decoration-gray-200 transition-colors"
                    >
                        바다알바 회원 탈퇴하기
                    </button>
                    <p className="text-[10px] text-gray-300 mt-2">탈퇴 시 계정 정보는 안전하게 분리 보관됩니다.</p>
                </div>

            </main>
        </div>
    )
}
