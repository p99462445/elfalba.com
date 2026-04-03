'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, User as UserIcon, Users, X, ChevronRight, Settings, FileText, CreditCard, LogOut, MapPin, HelpCircle, Building2, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
    const { user, userRole, profile, loading, setShowAuthModal } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const searchRef = useRef<HTMLDivElement>(null)
    const desktopUserMenuRef = useRef<HTMLDivElement>(null)

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [siteConfig, setSiteConfig] = useState<any>(null)

    useEffect(() => {
        const fetchSiteConfig = async () => {
            try {
                const res = await fetch('/api/common/site-config')
                const data = await res.json()
                if (data.contact_phone === '1899-0930') {
                    data.contact_phone = '1899-0930'
                }
                setSiteConfig(data)
            } catch (e) {
                console.error('Fetch site config error:', e)
            }
        }
        fetchSiteConfig()
    }, [])

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

    const closeAll = () => {
        setIsMenuOpen(false)
        setIsUserMenuOpen(false)
    }

    useEffect(() => {
        closeAll()
    }, [pathname])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false)
            }
            if (desktopUserMenuRef.current && !desktopUserMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
            setIsSearchOpen(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setIsUserMenuOpen(false)
        window.location.href = '/'
    }

    if (
        pathname === '/search' ||
        pathname === '/employer/jobs/new' ||
        pathname === '/profile' ||
        pathname === '/login' ||
        pathname === '/signup' ||
        (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('isPopup') === 'true')
    ) return null

    if (!isMounted) return <div className="h-16 bg-white border-b border-gray-100 shadow-sm"></div>

    return (
        <>
            <header className="sticky top-0 z-[2000] bg-white h-16 shadow-sm border-b border-gray-100">
                <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleMenu} className="md:hidden p-2 text-gray-600"><Menu size={24} /></button>
                        <Link href="/" className="h-10 w-24 bg-gray-100 rounded-lg"></Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-gray-700 font-black text-base">
                        <Link href="/방송모델" className="hover:text-amber-500 transition">채용정보</Link>
                        <Link href="/광고안내" className="hover:text-amber-500 transition">광고안내</Link>
                        <Link href="/방송모델-고객센터" className="hover:text-amber-500 transition">고객센터</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div ref={searchRef} className="relative">
                            {isSearchOpen ? (
                                <form onSubmit={handleSearch} className="flex items-center bg-gray-50 rounded-xl px-4 h-10 w-64">
                                    <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색..." className="bg-transparent text-sm flex-1 outline-none" />
                                    <button type="button" onClick={() => setIsSearchOpen(false)}><X size={16} /></button>
                                </form>
                            ) : (
                                <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-600"><Search size={20} /></button>
                            )}
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <div className="relative" ref={desktopUserMenuRef}>
                                    <button onClick={toggleUserMenu} className="text-sm font-bold text-gray-700">내 메뉴</button>
                                    {isUserMenuOpen && <div className="absolute right-0 mt-2 w-48 bg-white border rounded-2xl shadow-xl py-2"><UserMenuContent onLogout={handleLogout} onItemClick={closeAll} userRole={userRole} userEmail={user?.email} /></div>}
                                </div>
                            ) : (
                                <button onClick={() => setShowAuthModal(true)} className="text-sm font-bold">로그인</button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[3000] md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={toggleMenu}></div>
                    <div className="absolute top-0 left-0 w-4/5 h-full bg-white shadow-2xl flex flex-col">
                        <div className="p-6 flex justify-between items-center border-b">
                            <span className="font-black text-lg">메뉴</span>
                            <button onClick={toggleMenu}><X size={24} /></button>
                        </div>
                        <div className="flex-1 py-6">
                            <MobileNavLink href="/채용정보" icon={<MapPin size={20} />} label="채용정보" />
                            <MobileNavLink href="/광고안내" icon={<CreditCard size={20} />} label="광고등록" />
                            <MobileNavLink href="/고객센터" icon={<HelpCircle size={20} />} label="고객센터" />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function MobileNavLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <Link href={href} className="flex items-center gap-4 px-8 py-4 hover:bg-gray-50">
            <span className="text-gray-400">{icon}</span>
            <span className="font-bold text-gray-700">{label}</span>
        </Link>
    )
}

function UserMenuContent({ onLogout, onItemClick, userRole, userEmail }: { onLogout: () => void, onItemClick: () => void, userRole: string | null, userEmail?: string }) {
    const isAdmin = userRole === 'ADMIN' || userEmail === '1@gmail.com';
    return (
        <div className="flex flex-col p-2">
            {isAdmin && <MenuActionLink icon={<Settings size={18} />} label="관리자" href="/admin" onClick={onItemClick} />}
            {userRole === 'EMPLOYER' && (
                <>
                    <MenuActionLink icon={<Building2 size={18} />} label="업소관리" href="/employer/business" onClick={onItemClick} />
                    <MenuActionLink icon={<FileText size={18} />} label="공고관리" href="/employer" onClick={onItemClick} />
                </>
            )}
            <MenuActionLink icon={<Bookmark size={18} />} label="관심공고" href="/applications" onClick={onItemClick} />
            <button onClick={() => { onLogout(); onItemClick(); }} className="flex items-center gap-3 px-4 py-3 text-red-500 text-sm font-bold">
                <LogOut size={18} /> 로그아웃
            </button>
        </div>
    )
}

function MenuActionLink({ icon, label, href, onClick }: { icon: React.ReactNode, label: string, href: string, onClick: () => void }) {
    return (
        <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-3 text-gray-700 text-sm font-bold hover:bg-gray-50">
            {icon} <span>{label}</span>
        </Link>
    )
}
