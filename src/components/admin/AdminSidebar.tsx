'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LogOut, Users, FileText, CreditCard, LayoutDashboard, 
    MessageSquare, Megaphone, Flag, BarChart3, ChevronDown, ChevronRight, GripVertical, LucideIcon 
} from 'lucide-react';

interface MenuItem {
    title: string;
    href: string;
    exact?: boolean;
}

interface Category {
    id: string;
    title: string;
    icon?: LucideIcon;
    items: MenuItem[];
    color?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    {
        id: 'cat-dash',
        title: '대시보드',
        items: [{ title: '통계 홈', href: '/admin', exact: true }]
    },
    {
        id: 'cat-vip',
        title: 'VIP 전용 통제',
        color: 'text-amber-500 dark:text-amber-400',
        items: [
            { title: '👑 공식 파트너 관리', href: '/admin/official-partners' },
            { title: '🔎 노출 공고 관리', href: '/admin/exposure-management' }
        ]
    },
    {
        id: 'cat-users',
        title: '회원 관리',
        items: [
            { title: '회원 목록/제재', href: '/admin/users', exact: true },
            { title: '업소 승인 관리', href: '/admin/employers' },
            { title: '회원 로그인 로그', href: '/admin/users/login-logs' }
        ]
    },
    {
        id: 'cat-content',
        title: '콘텐츠 관리',
        items: [
            { title: '채용공고 관리', href: '/admin/jobs' },
            { title: '공고 수정로그', href: '/admin/logs' },
            { title: '이력서 관리', href: '/admin/resumes' }
        ]
    },
    {
        id: 'cat-revenue',
        title: '수익 관리',
        items: [
            { title: '결제·정산 관리', href: '/admin/payments', exact: true },
            { title: '날짜별 매출통계', href: '/admin/payments/daily' },
            { title: '서비스 금액 설정', href: '/admin/services' }
        ]
    },
    {
        id: 'cat-system',
        title: '시스템 관리',
        items: [
            { title: '익명 커뮤니티 관리', href: '/admin/community' },
            { title: '정보 분류 관리', href: '/admin/categories' },
            { title: '배너·광고 관리', href: '/admin/banners' },
            { title: '공지·FAQ 관리', href: '/admin/notices' },
            { title: '실시간 채팅 관리', href: '/admin/chats' },
            { title: '환경 설정 (사이트 정보)', href: '/admin/settings' }
        ]
    }
];

export default function AdminSidebar() {
    const pathname = usePathname() || '';
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [collapsed, setCollapsed] = useState<string[]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    useEffect(() => {
        const savedOrder = localStorage.getItem('admin_sidebar_order');
        const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed');

        if (savedOrder) {
            try {
                const orderIds = JSON.parse(savedOrder) as string[];
                const ordered = [...DEFAULT_CATEGORIES].sort((a, b) => 
                    orderIds.indexOf(a.id) - orderIds.indexOf(b.id)
                );
                setCategories(ordered);
            } catch (e) {}
        }

        if (savedCollapsed) {
            try {
                setCollapsed(JSON.parse(savedCollapsed));
            } catch (e) {}
        }
    }, []);

    const toggleCollapse = (id: string) => {
        const next = collapsed.includes(id) 
            ? collapsed.filter(c => c !== id) 
            : [...collapsed, id];
        setCollapsed(next);
        localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(next));
    };

    const getLinkClass = (path: string, exact: boolean = false) => {
        const isActive = exact 
            ? pathname === path 
            : pathname.startsWith(path) && (pathname.length === path.length || pathname[path.length] === '/');
            
        return isActive 
            ? "flex items-center px-4 py-2.5 text-white bg-gradient-to-r from-amber-500 to-purple-500 shadow-md font-bold rounded-xl transition-all scale-[1.02]"
            : "flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600 rounded-lg transition-colors text-sm font-medium";
    };

    // Drag and Drop handlers
    const onDragStart = (id: string) => {
        setDraggedId(id);
    };

    const onDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = categories.findIndex(c => c.id === draggedId);
        const targetIndex = categories.findIndex(c => c.id === targetId);
        
        const next = [...categories];
        const [moved] = next.splice(draggedIndex, 1);
        next.splice(targetIndex, 0, moved);
        setCategories(next);
    };

    const onDragEnd = () => {
        setDraggedId(null);
        localStorage.setItem('admin_sidebar_order', JSON.stringify(categories.map(c => c.id)));
    };

    return (
        <aside className="w-full md:w-64 bg-white dark:bg-dark-card shadow-xl dark:shadow-none md:min-h-screen p-5 md:flex-shrink-0 border-r dark:border-dark-border z-20">
            <div className="mb-8 pl-1">
                <Link href="/admin">
                    <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-amber-500 via-purple-500 to-indigo-600 tracking-tighter cursor-pointer hover:opacity-80 transition-opacity">
                        ADMIN PANEL
                    </h2>
                </Link>
            </div>

            <nav className="space-y-4">
                {categories.map((cat) => (
                    <div 
                        key={cat.id}
                        draggable
                        onDragStart={() => onDragStart(cat.id)}
                        onDragOver={(e) => onDragOver(e, cat.id)}
                        onDragEnd={onDragEnd}
                        className={`space-y-1 transition-all ${draggedId === cat.id ? 'opacity-30 scale-95' : 'opacity-100'}`}
                    >
                        {/* Category Header */}
                        <div 
                            className="group flex items-center justify-between cursor-pointer"
                            onClick={() => toggleCollapse(cat.id)}
                        >
                            <div className="flex items-center gap-2">
                                <GripVertical size={14} className="text-gray-200 group-hover:text-gray-400 transition-colors cursor-grab" />
                                <span className={`text-[11px] font-black uppercase tracking-widest ${cat.color || 'text-gray-400'}`}>
                                    {cat.title}
                                </span>
                            </div>
                            <button className="text-gray-300 group-hover:text-gray-500 transition-colors">
                                {collapsed.includes(cat.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {/* Items */}
                        {!collapsed.includes(cat.id) && (
                            <div className="space-y-1.5 pl-4 pt-1 border-l-2 border-gray-50 dark:border-dark-bg ml-2 animate-in slide-in-from-top-2 duration-200">
                                {cat.items.map((item, idx) => (
                                    <Link 
                                        key={idx} 
                                        href={item.href} 
                                        className={getLinkClass(item.href, item.exact)}
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-dark-border">
                <button
                    onClick={async () => {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = '/';
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all font-black text-sm group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>LOGOUT</span>
                </button>
            </div>
        </aside>
    );
}
