'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ChevronRight } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Notice {
    id: string
    title: string
    content: string
    is_important: boolean
    created_at: string | Date
}

export default function HomeNoticesSection({ notices }: { notices: Notice[] }) {
    const [selected, setSelected] = useState<Notice | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [clickY, setClickY] = useState<number>(0)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (selected) {
            const scrollY = window.scrollY;
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('data-scroll-y', scrollY.toString());
        } else {
            document.body.style.overflow = '';
            const scrollY = document.body.getAttribute('data-scroll-y');
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY));
                document.body.removeAttribute('data-scroll-y');
            }
        }
        return () => { 
            document.body.style.overflow = '';
            document.body.removeAttribute('data-scroll-y');
        }
    }, [selected])

    return (
        <section className="px-4 pt-8 pb-2">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-xl">📢</span>
                        <h3 className="text-lg font-bold">공지사항</h3>
                    </div>
                    <Link href="/support?tab=notice" className="text-xs font-black text-gray-300 hover:text-amber-400 flex items-center gap-0.5 transition">
                        전체보기 <ChevronRight size={12} />
                    </Link>
                </div>

                {notices.length === 0 ? (
                    <p className="text-sm text-gray-300 font-bold py-4">등록된 공지사항이 없습니다.</p>
                ) : (
                    <ul className="space-y-3">
                        {notices.map(n => (
                            <li key={n.id}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setClickY(rect.top);
                                        setSelected(n);
                                    }}
                                    className="w-full text-left flex items-start gap-2 py-1 group"
                                >
                                    {n.is_important && (
                                        <span className="flex-shrink-0 text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded mt-0.5">중요</span>
                                    )}
                                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-300 font-bold group-hover:text-amber-500 transition line-clamp-2 leading-snug break-keep">
                                        {n.title}
                                    </span>
                                    <span className="ml-auto text-[10px] text-gray-300 flex-shrink-0 mt-0.5">
                                        {isMounted ? new Date(n.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : ''}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selected && isMounted && document.body && createPortal(
                <div
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-white dark:bg-dark-card w-[calc(100%-32px)] max-w-lg rounded-[32px] shadow-2xl overflow-hidden absolute left-1/2 -translate-x-1/2 animate-in fade-in zoom-in duration-200"
                        style={{ 
                            top: `${Math.max(20, Math.min(clickY - 50, window.innerHeight - 400))}px`,
                        }}
                        onClick={e => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-50 dark:border-dark-border">
                            <div className="flex items-start gap-2 pr-4">
                                {selected.is_important && (
                                    <span className="flex-shrink-0 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full mt-0.5">중요</span>
                                )}
                                <h3 className="text-[17px] font-black text-gray-900 dark:text-gray-100 leading-snug break-keep">{selected.title}</h3>
                            </div>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelected(null);
                                }} 
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-400 transition flex-shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
                            <p className="text-xs text-gray-300 font-bold mb-4">
                                {new Date(selected.created_at).toLocaleDateString('ko-KR')}
                            </p>
                            <div
                                className="text-[14px] sm:text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-keep space-y-3"
                                dangerouslySetInnerHTML={{ __html: selected.content }}
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    const anchor = target.closest('a');
                                    if (anchor && anchor.href) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(anchor.href, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </section>
    )
}
