'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Tag, Users, HelpCircle, User, MessageCircle, ArrowRight, Star, Heart, Flame } from 'lucide-react'
import { buildSeoUrl, CATEGORY_SLUG_TO_UI } from '@/lib/seoUrls'

const REGIONS = [
    { name: '서울', slug: 'seoul' },
    { name: '인천/경기', slug: 'incheon-gyeonggi' },
    { name: '대전/세종/충청', slug: 'daejeon-sejong-chungcheong' },
    { name: '대구/경북', slug: 'daegu-gyeongbuk' },
    { name: '광주/전라', slug: 'gwangju-jeolla' },
    { name: '부산/울산/경남', slug: 'busan-ulsan-gyeongnam' },
    { name: '제주/강원', slug: 'jeju-gangwon' },
]

const CATEGORIES = [
    { name: CATEGORY_SLUG_TO_UI.room, slug: 'room', icon: '🍷' },
    { name: CATEGORY_SLUG_TO_UI.karaoke, slug: 'karaoke', icon: '🎤' },
    { name: CATEGORY_SLUG_TO_UI.tenpro, slug: 'tenpro', icon: '👑' },
    { name: CATEGORY_SLUG_TO_UI.bar, slug: 'bar', icon: '🍸' },
    { name: CATEGORY_SLUG_TO_UI.massage, slug: 'massage', icon: '🌱' },
    { name: CATEGORY_SLUG_TO_UI.etc, slug: 'etc', icon: '✨' },
]

export default function JobFilterSection() {
    const router = useRouter()
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const handleRegionClick = (slug: string) => {
        // Toggle off if same
        if (selectedRegion === slug) {
            setSelectedRegion(null)
        } else {
            setSelectedRegion(slug)
        }
    }

    const handleCategoryClick = (slug: string) => {
        if (selectedCategory === slug) {
            setSelectedCategory(null)
        } else {
            setSelectedCategory(slug)
        }
    }

    const handleSearch = () => {
        // Requirement: Filter interactions must generate SEO URLs (NOT query URLs).
        // For Seoul, allow sub-region in URL. For others, skip sub.
        const finalSub = selectedRegion === 'seoul' ? null : null; // In JobFilterSection, we don't have sub-selection yet, so it's simple.
        router.push(buildSeoUrl(selectedRegion, null, selectedCategory))
    }

    // Auto-navigate immediately when only one filter is chosen
    const handleRegionOnly = (slug: string) => {
        handleRegionClick(slug)
        // Navigate with category
        if (selectedRegion !== slug) {
            router.push(buildSeoUrl(slug, null, selectedCategory))
        }
    }

    const selectedRegionName = REGIONS.find(r => r.slug === selectedRegion)?.name
    const selectedCategoryName = CATEGORIES.find(c => c.slug === selectedCategory)?.name

    return (
        <section className="px-4 py-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="text-amber-400" size={20} />
                    <h2 className="text-xl font-bold">채용정보</h2>
                </div>
                {/* Selected state badge */}
                {(selectedRegion || selectedCategory) && (
                    <button
                        onClick={() => { setSelectedRegion(null); setSelectedCategory(null) }}
                        className="text-xs font-black text-gray-300 hover:text-amber-400 transition"
                    >
                        초기화
                    </button>
                )}
            </div>

            <div className="bg-[#fff9fa] dark:bg-dark-card/50 rounded-3xl border border-amber-50 dark:border-dark-border shadow-sm overflow-hidden">
                {/* Region Tabs */}
                <div className="p-5 border-b border-amber-50 dark:border-dark-border">
                    <div className="flex items-center gap-1.5 mb-3">
                        <MapPin size={13} className="text-amber-300" />
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">지역</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {REGIONS.map((r, i) => (
                            <React.Fragment key={r.slug}>
                                <button
                                    onClick={() => handleRegionOnly(r.slug)}
                                    className={`text-sm font-bold py-0.5 transition-all relative ${selectedRegion === r.slug
                                        ? 'text-[#f472b6]'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-[#f472b6]'
                                        }`}
                                >
                                    {r.name}
                                    {selectedRegion === r.slug && (
                                        <span className="absolute -bottom-0.5 left-0 w-full h-[2px] bg-[#f472b6] rounded-full" />
                                    )}
                                </button>
                                {i < REGIONS.length - 1 && <span className="text-gray-200 self-center">|</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Category Chips */}
                <div className="p-5">
                    <div className="flex items-center gap-1.5 mb-3">
                        <Tag size={13} className="text-indigo-300" />
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">업종</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.slug}
                                onClick={() => {
                                    setSelectedCategory(prev => prev === cat.slug ? null : cat.slug)
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border ${selectedCategory === cat.slug
                                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-none'
                                    : 'bg-white dark:bg-dark-bg text-gray-500 dark:text-gray-400 border-gray-100 dark:border-dark-border hover:border-indigo-200 hover:text-indigo-400'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CTA Button (shown when at least one filter is active) */}
                {(selectedRegion || selectedCategory) && (
                    <div className="px-5 pb-5">
                        <button
                            onClick={handleSearch}
                            className="w-full h-12 bg-gray-900 dark:bg-amber-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-gray-200/50 dark:shadow-none hover:bg-gray-800 dark:hover:bg-amber-500 active:scale-95 transition-all"
                        >
                            <span className="text-gray-300 font-normal">
                                {selectedRegionName || '전국'}
                                {selectedCategoryName && <> · {selectedCategoryName}</>}
                            </span>
                            <span>채용정보 보기</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
