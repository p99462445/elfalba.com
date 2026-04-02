'use client'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ChevronRight,
    Settings,
    MessageSquareMore,
    Bookmark,
    FileText,
    LogOut,
    LogIn,
    UserPlus,
    ShieldCheck,
    HelpCircle,
    Bell,
    Heart,
    MessageCircle,
    Building2,
    Briefcase,
    CreditCard,
    Users,
    Pencil,
    Headphones
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function MyPage() {
    const { user, userRole, profile, loading } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        if (!confirm('로그아웃 하시겠습니까?')) return
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const handleCustomerServiceClick = async () => {
        if (!user) {
            router.push('/login?returnUrl=/mypage')
            return
        }
        
        try {
            const res = await fetch('/api/chat/qna', { method: 'POST' })
            const data = await res.json()
            if (data.roomId) {
                router.push(`/messages?room=${data.roomId}`)
            } else {
                alert('고객센터 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.')
            }
        } catch (error) {
            console.error('QnA connection error:', error)
            alert('고객센터 연결 중 오류가 발생했습니다.')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-dark-card px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm border-b border-gray-100 dark:border-dark-border">
                {user ? (
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-amber-50 dark:bg-dark-bg rounded-2xl flex items-center justify-center relative border-2 border-white dark:border-dark-border shadow-sm flex-shrink-0">
                            <div className="text-xl font-black text-amber-500">
                                {(userRole === 'EMPLOYER' ? (profile?.businessName?.[0] || '업') : (profile?.nickname?.[0] || user.user_metadata?.nickname?.[0] || '회'))}
                            </div>
                            <button
                                onClick={() => router.push('/profile')}
                                className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white border-2 border-white dark:border-dark-card shadow-sm active:scale-90 transition-transform"
                            >
                                <Settings size={12} />
                            </button>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-[18px] font-black text-gray-900 dark:text-gray-100 truncate">
                                    {(userRole === 'EMPLOYER' ? (profile?.nickname || profile?.businessName || '상호명 미등록') : (profile?.nickname || user.user_metadata?.nickname || '회원'))}님
                                </h1>
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg text-gray-400 hover:text-amber-500 transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-tight ${userRole === 'ADMIN' ? 'bg-purple-500 text-white' :
                                        userRole === 'EMPLOYER' ? 'bg-blue-500 text-white' :
                                            'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {userRole === 'ADMIN' ? '총관리자' :
                                            userRole === 'EMPLOYER' ? '업소회원' : '일반회원'}
                                    </span>
                                    {userRole === 'EMPLOYER' && (
                                        <span className="text-[10px] font-bold text-gray-400">(프로필/채팅 노출 이름)</span>
                                    )}
                                </div>
                            </div>
                            <p className="text-[13px] text-gray-400 dark:text-gray-500 font-bold truncate tracking-tight">
                                {user.email?.endsWith('@elfalba.com') ? user.email.replace('@elfalba.com', '') : user.email}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-4">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6">
                            <LogIn size={32} className="text-gray-300" />
                        </div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">로그인이 필요합니다</h1>
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-bold mb-8 text-center">
                            로그인하시면 더 많은<br />서비스를 이용하실 수 있습니다.
                        </p>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                            <Link href="/login" className="h-14 bg-gray-100 dark:bg-dark-bg rounded-2xl flex items-center justify-center font-black text-gray-700 dark:text-gray-300 gap-2 shadow-sm active:scale-95 transition-all">
                                로그인
                            </Link>
                            <Link href="/signup" className="h-14 bg-[#f59e0b] text-white rounded-2xl flex items-center justify-center font-black gap-2 shadow-lg shadow-amber-100 dark:shadow-none active:scale-95 transition-all">
                                회원가입
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Menu List */}
            <main className="max-w-lg mx-auto p-6 space-y-4">
                <section>
                    <div className="bg-white dark:bg-dark-card rounded-[32px] p-2 border border-gray-100 dark:border-dark-border shadow-soft">
                        {/* Admin Special Menus */}
                        {userRole === 'ADMIN' && (
                            <>
                                <MenuLink icon={<ShieldCheck size={20} />} label="시스템 관리자" sub="회원 및 광고 전체 관리" href="/admin" color="text-purple-500" />
                                <MenuDivider />
                            </>
                        )}
                        
                        {/* Role-based Menu List */}
                        {userRole === 'EMPLOYER' ? (
                            <>
                                {/* Employer Menu Order: 1.공고관리, 2.업소정보관리, 3.채팅, 4.내정보수정, 5.고객센터 */}
                                <MenuLink icon={<FileText size={20} />} label="공고관리" sub="공고 등록 및 점프 포인트 관리" href="/employer" color="text-amber-500" />
                                <MenuDivider />
                                <MenuLink icon={<Building2 size={20} />} label="업소정보관리" sub="상호명 및 연락처 정보 수정" href="/employer/business" color="text-blue-500" />
                                <MenuDivider />
                                <MenuLink icon={<MessageCircle size={20} />} label="채팅메세지" sub="업체와의 대화 내역" href="/messages" color="text-blue-400" />
                                <MenuDivider />
                                <MenuLink icon={<Settings size={20} />} label="내정보수정" sub="비밀번호 및 닉네임 관리" href="/profile" color="text-gray-400" />
                                <MenuDivider />
                            </>
                        ) : (
                            <>
                                {/* Regular User Menu Order */}
                                <MenuLink icon={<Bookmark size={20} />} label="관심공고목록" sub="찜해둔 소중한 공고들" href="/applications" color="text-orange-500" />
                                <MenuDivider />
                                <MenuLink icon={<MessageCircle size={20} />} label="채팅메세지" sub="업체와의 대화 내역" href="/messages" color="text-blue-400" />
                                <MenuDivider />
                                <MenuLink icon={<Settings size={20} />} label="내정보수정" sub="비밀번호 및 닉네임 관리" href="/profile" color="text-gray-400" />
                                <MenuDivider />
                                <MenuLink icon={<FileText size={20} />} label="내 이력서 관리" sub="나를 어필할 수 있는 한 줄 소개" href="/모델구인구직/등록" color="text-amber-500" />
                                <MenuDivider />
                            </>
                        )}

                        {/* Common Menu: 고객센터 (Always at bottom) */}
                        <MenuLink 
                            icon={<Headphones size={20} />} 
                            label="고객센터" 
                            sub="24시간 1:1 빠른 문의 및 상담" 
                            onClick={handleCustomerServiceClick}
                            color="text-amber-500" 
                        />
                    </div>
                </section>

                {/* Logout */}
                {user && (
                    <div className="pt-2">
                        <button
                            onClick={handleLogout}
                            className="w-full h-14 bg-gray-50 dark:bg-dark-bg text-red-500 rounded-[24px] flex items-center justify-center gap-2 font-black text-[14px] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-gray-100 dark:border-dark-border"
                        >
                            <LogOut size={18} />
                            로그아웃
                        </button>
                    </div>
                )}

                <div className="text-center py-6">
                    <p className="text-[10px] text-gray-300 dark:text-gray-700 font-bold tracking-tight uppercase">
                        © {new Date().getFullYear()} ELFALBA. Premium Employment Platform.
                    </p>
                </div>
            </main>
        </div>
    )
}

function MenuLink({ icon, label, sub, href, color, onClick }: { icon: React.ReactNode, label: string, sub: string, href?: string, color: string, onClick?: () => void }) {
    const content = (
        <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-2xl transition-all group active:scale-[0.99] w-full text-left">
            <div className={`w-11 h-11 rounded-2xl bg-gray-50 dark:bg-dark-bg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-[15px] font-black text-gray-900 dark:text-gray-100 tracking-tight">{label}</p>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">{sub}</p>
            </div>
            <ChevronRight size={18} className="text-gray-200 dark:text-gray-700 group-hover:text-amber-300 transition-colors" />
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="w-full">
                {content}
            </button>
        )
    }

    return (
        <Link href={href || '#'} className="block">
            {content}
        </Link>
    )
}

function MenuDivider() {
    return <div className="h-px bg-gray-50 dark:bg-dark-border mx-4" />
}
