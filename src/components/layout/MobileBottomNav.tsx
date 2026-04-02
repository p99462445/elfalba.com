'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, MapPin, Users, HeadphonesIcon, UserCircle2, X, Settings, FileText, CreditCard, LogOut, LogIn, ShieldCheck, MessageSquareMore, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { useAuth } from '@/context/AuthContext'

const MAIN_NAV = [
    { href: '/', label: '홈', icon: Home },
    { href: '/방송모델', label: '채용정보', icon: MapPin },
    { href: '/모델구인구직', label: '이력서', icon: FileText },
    { href: '/방송모델-고객센터', label: '고객센터', icon: HeadphonesIcon },
]

export default function MobileBottomNav() {
    const { user, userRole, setShowAuthModal } = useAuth()
    const [isMounted, setIsMounted] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [showProfile, setShowProfile] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setShowProfile(false)
        router.push('/')
        router.refresh()
    }

    const decodedPathname = decodeURIComponent(pathname)

    // Hide on admin/employer pages and Job Detail pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/employer') || decodedPathname.startsWith('/jobs/') || decodedPathname.startsWith('/구인/')) return null

    const isAdmin = userRole === 'ADMIN' || user?.email === '1@gmail.com'

    return (
        <>
            {/* Bottom Nav Bar - Slimmer h-14 */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="grid grid-cols-5 h-14">
                    {MAIN_NAV.map(({ href, label, icon: Icon }) => {
                        const isHomePath = pathname === '/' || decodedPathname === '/' || !pathname || pathname === '';
                        let isActive = false;

                        if (href === '/') {
                            isActive = isHomePath;
                        } else if (href === '/방송모델'.normalize('NFC')) {
                            const isCommunity = decodedPathname.includes('커뮤니티'.normalize('NFC'));
                            const isSupport = decodedPathname.includes('고객센터'.normalize('NFC'));
                            const isAdInfo = decodedPathname.includes('광고안내'.normalize('NFC'));
                            const isAuth = pathname.includes('login') || pathname.includes('signup');
                            const isMisc = pathname.includes('profile') || pathname.includes('messages') || pathname.includes('search');
                            const isDetail = pathname.includes('job-detail') || pathname.includes('구인');

                            isActive = !isHomePath && !isCommunity && !isSupport && !isAdInfo && !isAuth && !isMisc && !isDetail && !pathname.startsWith('/admin');

                            // '/방송모델' 관련 경로일 때는 확실히 켬
                            if (decodedPathname.includes('방송모델'.normalize('NFC')) && !isCommunity && !isSupport) isActive = true;
                        } else {
                            isActive = decodedPathname.startsWith(href.normalize('NFC'));
                        }

                        return (
                            <Link
                                key={href}
                                href={href}
                                prefetch={true}
                                onClick={(e) => {
                                    if (isActive) {
                                        e.preventDefault();
                                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                                    }
                                }}
                                className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${isActive ? 'text-amber-500' : 'text-gray-400'}`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[9px] font-black tracking-tight">{label}</span>
                            </Link>
                        )
                    })}

                    {/* 내정보 버튼 */}
                    <Link
                        href={isMounted ? (user ? "/mypage" : "/login") : "/mypage"}
                        onClick={(e) => {
                            if (decodedPathname.startsWith('/mypage') || decodedPathname.startsWith('/login')) {
                                e.preventDefault();
                                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                            }
                        }}
                        className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${(decodedPathname.startsWith('/mypage') || decodedPathname.startsWith('/login')) ? 'text-amber-500' : 'text-gray-400'}`}
                    >
                        <UserCircle2 size={18} strokeWidth={(decodedPathname.startsWith('/mypage') || decodedPathname.startsWith('/login')) ? 2.5 : 2} />
                        <span className="text-[9px] font-black tracking-tight">내정보</span>
                    </Link>
                </div>
            </nav>

            {/* Profile Drawer - Removed since we use /mypage now */}
        </>
    )
}

function DrawerItem({ icon, label, href, onClose, highlight }: {
    icon: React.ReactNode; label: string; href: string; onClose: () => void; highlight?: boolean
}) {
    return (
        <Link
            href={href}
            prefetch={true}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition font-black text-[14px] ${highlight ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg'}`}
        >
            <span className={highlight ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}>{icon}</span>
            {label}
        </Link>
    )
}
