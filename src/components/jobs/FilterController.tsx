'use client'
import React, { useState } from 'react'
import { MapPin, Briefcase, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { CATEGORY_SLUG_TO_UI, buildSeoUrl } from '@/lib/seoUrls'

interface FilterControllerProps {
    mainRegions: any[]
    allSubRegions: any[]
    categories: any[]
    activeParent: any
    activeSub: any
    activeCategory: any
    currentParentSlug: string | null
    currentSubSlug: string | null
    currentCategorySlug: string | null
}

export default function FilterController({
    mainRegions,
    allSubRegions,
    categories,
    activeParent,
    activeSub,
    activeCategory,
    currentParentSlug,
    currentSubSlug,
    currentCategorySlug
}: FilterControllerProps) {
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    
    // Track which parent is being hovered/clicked INSIDE the dropdown
    const [tempActiveParentId, setTempActiveParentId] = useState<number | null>(activeParent?.id || null)

    const locationLabel = activeSub 
        ? `${activeParent?.name} ${activeSub.name.split('/')[0]}`
        : activeParent 
            ? activeParent.name 
            : '전국'

    const categoryLabel = activeCategory 
        ? CATEGORY_SLUG_TO_UI[activeCategory.slug as keyof typeof CATEGORY_SLUG_TO_UI] || activeCategory.name.split('/')[0]
        : '전체'

    // Helper to build URL (similar to server component one)
    const buildUrl = (p: { parent?: string | null, sub?: string | null, category?: string | null }) => {
        let fParent = p.parent !== undefined ? p.parent : currentParentSlug;
        let fCategory = p.category !== undefined ? p.category : currentCategorySlug;
        let fSub = p.sub !== undefined ? p.sub : (activeSub ? activeSub.name : currentSubSlug);

        // If parent is being changed, reset sub unless a sub is also provided
        if (p.parent !== undefined && p.parent !== currentParentSlug) {
            fSub = p.sub !== undefined ? p.sub : null;
        }

        return buildSeoUrl(fParent, fSub, fCategory);
    }

    // Filter sub-regions locally
    const currentTempSubRegions = tempActiveParentId 
        ? allSubRegions.filter(r => r.parent_id === tempActiveParentId)
        : []

    return (
        <div className="max-w-2xl mx-auto px-4 mb-0 relative">
            <div className="flex gap-2 relative z-[60]">
                {/* Location Button */}
                <button 
                    onClick={() => {
                        setIsLocationModalOpen(!isLocationModalOpen)
                        setIsCategoryModalOpen(false)
                        setTempActiveParentId(activeParent?.id || null)
                    }}
                    className={`flex-1 flex items-center justify-between px-4 py-1 border rounded-2xl transition-all active:scale-[0.98] ${isLocationModalOpen ? 'bg-white dark:bg-dark-card border-amber-500 shadow-lg' : 'bg-gray-50 dark:bg-dark-card border-gray-100 dark:border-dark-border shadow-sm shadow-gray-50 dark:shadow-none'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-xl transition-colors ${isLocationModalOpen ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
                            <MapPin size={18} />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[13px] font-black text-gray-900 dark:text-gray-100 leading-none">{locationLabel}</span>
                        </div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isLocationModalOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Category Button */}
                <button 
                    onClick={() => {
                        setIsCategoryModalOpen(!isCategoryModalOpen)
                        setIsLocationModalOpen(false)
                    }}
                    className={`flex-1 flex items-center justify-between px-4 py-1 border rounded-2xl transition-all active:scale-[0.98] ${isCategoryModalOpen ? 'bg-white dark:bg-dark-card border-amber-500 shadow-lg' : 'bg-gray-50 dark:bg-dark-card border-gray-100 dark:border-dark-border shadow-sm shadow-gray-50 dark:shadow-none'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-xl transition-colors ${isCategoryModalOpen ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
                            <Briefcase size={18} />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[13px] font-black text-gray-900 dark:text-gray-100 leading-none">{categoryLabel}</span>
                        </div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isCategoryModalOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdowns Backdrop */}
            {(isLocationModalOpen || isCategoryModalOpen) && (
                <div 
                    className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[1px]" 
                    onClick={() => {
                        setIsLocationModalOpen(false)
                        setIsCategoryModalOpen(false)
                    }}
                />
            )}

            {/* Location Dropdown (2-Column) */}
            {isLocationModalOpen && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out origin-top flex h-[400px]">
                    {/* Left Column: Major Regions */}
                    <div className="w-[40%] bg-gray-50 dark:bg-dark-bg/30 border-r border-gray-50 dark:border-dark-border overflow-y-auto no-scrollbar">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setTempActiveParentId(null)}
                                className={`w-full px-4 py-3.5 rounded-xl text-left text-[14px] font-black transition-all ${tempActiveParentId === null ? 'bg-white dark:bg-dark-card text-amber-500 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                            >
                                전국
                            </button>
                            {mainRegions.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setTempActiveParentId(r.id)}
                                    className={`w-full px-4 py-3.5 rounded-xl text-left text-[14px] font-black transition-all ${tempActiveParentId === r.id ? 'bg-white dark:bg-dark-card text-amber-500 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                                >
                                    {r.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Sub Regions */}
                    <div className="flex-1 bg-white dark:bg-dark-card overflow-y-auto no-scrollbar">
                        <div className="p-4">
                            {tempActiveParentId === null ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20">
                                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                                        <MapPin size={24} />
                                    </div>
                                    <p className="text-[13px] font-bold text-gray-400 dark:text-gray-500 leading-relaxed">
                                        전국 어디든<br />좋은 일자리를 찾아보세요!
                                    </p>
                                    <Link
                                        href={buildUrl({ parent: null, sub: null })}
                                        className="px-6 py-2 bg-amber-500 text-white rounded-xl font-black text-sm shadow-lg shadow-amber-100 dark:shadow-none active:scale-95 transition-all"
                                    >
                                        전국 리스트 보기
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-1">
                                        {/* "ALL" Item as a regular row */}
                                        <Link 
                                            href={buildUrl({ parent: mainRegions.find(r => r.id === tempActiveParentId)?.slug, sub: null })}
                                            className="px-3 py-2.5 rounded-xl text-[14px] font-bold text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-500 transition-all active:scale-[0.98] block"
                                        >
                                            전체
                                        </Link>

                                        {currentTempSubRegions.map(s => (
                                            <Link
                                                key={s.id}
                                                href={buildUrl({ parent: mainRegions.find(r => r.id === tempActiveParentId)?.slug, sub: s.name })}
                                                className={`px-3 py-2.5 rounded-xl text-[14px] font-bold transition-all ${activeSub?.id === s.id ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg'}`}
                                            >
                                                {s.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Category Dropdown */}
            {isCategoryModalOpen && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out origin-top">
                    <div className="p-5">
                        <div className="grid grid-cols-3 gap-2">
                            <Link
                                href={buildUrl({ category: null })}
                                className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${!activeCategory ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100 dark:shadow-none' : 'bg-white dark:bg-dark-bg text-gray-400 border-gray-100 dark:border-dark-border'}`}
                            >
                                <span className="text-[13px] font-black">전체보기</span>
                            </Link>
                            {categories.map(c => {
                                const label = CATEGORY_SLUG_TO_UI[c.slug as keyof typeof CATEGORY_SLUG_TO_UI] || c.name.split('/')[0]
                                return (
                                    <Link
                                        key={c.slug}
                                        href={buildUrl({ category: c.slug })}
                                        className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${activeCategory?.id === c.id ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100 dark:shadow-none' : 'bg-white dark:bg-dark-bg text-gray-400 dark:text-gray-500 border-gray-100 dark:border-dark-border hover:border-amber-300'}`}
                                    >
                                        <span className="text-[13px] font-black">{label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
