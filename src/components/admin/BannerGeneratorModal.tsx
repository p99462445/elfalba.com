'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Wand2, Palette, Type, Image as ImageIcon, Sparkles, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image-compression'

interface BannerGeneratorModalProps {
    jobId: string
    initialTitle: string
    onClose: () => void
    onSuccess: (generatedUrl: string) => void
}

const BG_PRESETS = [
    { id: 'B1', name: '🪨 다크 빈티지 스톤' },
    { id: 'B2', name: '🍷 블랙 실크 럭셔리' },
    { id: 'B3', name: '🔦 스포트라이트 무대' },
    { id: 'B4', name: '👾 레트로 네온 그리드' },
    { id: 'B5', name: '🌈 베이퍼웨이브 오로라' },
    { id: 'B6', name: '🟣 씬스웨이브 마젠타' },
    { id: 'B7', name: '🔥 골드 레이저 이펙트' },
    { id: 'B8', name: '🏙️ 사이버펑크 네온시티' }
]

const FONTS = [
    { id: 'SANS', name: '검은고딕 (두껍고 강렬함)' },
    { id: 'SERIF', name: '나눔명조 (우아하고 고급짐)' },
    { id: 'JUA', name: '배민주아 (귀엽고 둥긂)' },
    { id: 'DOHYEON', name: '배민도현 (레트로 반듯)' }
]

const EFFECTS = [
    { id: 'NEON_PINK', name: '핫핑크 네온 글로우 💖' },
    { id: 'NEON_BLUE', name: '사이버 블루 네온 💠' },
    { id: 'NEON_GOLD', name: '럭셔리 골드 네온 👑' },
    { id: 'SHADOW', name: '다크 드롭 섀도우 묵직함 🎱' },
    { id: 'CLEAN', name: '깔끔한 무지 텍스트 ⬜' }
]

export default function BannerGeneratorModal({ jobId, initialTitle, onClose, onSuccess }: BannerGeneratorModalProps) {
    const defaultText = initialTitle ? initialTitle.split(' ')[0] : '업소명'
    const [t1, setT1] = useState(defaultText)
    const [t2, setT2] = useState('가게모집')

    const [s1, setS1] = useState(130)
    const [s2, setS2] = useState(80)

    const [bgType, setBgType] = useState<'IMAGE' | 'SOLID' | 'CUSTOM'>('IMAGE')
    const [bgVal, setBgVal] = useState('B1')
    const [uploadingBg, setUploadingBg] = useState(false)
    const [solidColor, setSolidColor] = useState('#0a0a0a')
    const [font, setFont] = useState('SANS')
    const [effect, setEffect] = useState('SHADOW')
    const [textColor, setTextColor] = useState('#ffffff')

    const [saving, setSaving] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Prevent body scroll when modal is open to avoid background shifting and viewport cut-offs
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    // Generate valid URL for iframe/preview
    const activeBgVal = bgType === 'SOLID' ? solidColor : bgVal
    const previewUrl = `/api/og/banner?t1=${encodeURIComponent(t1)}&t2=${encodeURIComponent(t2)}&s1=${s1}&s2=${s2}&bgtype=${bgType}&bgval=${encodeURIComponent(activeBgVal)}&font=${font}&effect=${effect}&color=${encodeURIComponent(textColor)}`

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
            alert('배너 엔진 호환성을 위해 JPG 또는 PNG 이미지만 업로드 가능합니다.')
            return
        }
        setUploadingBg(true)
        try {
            const supabase = createClient()
            // Compress custom BG (1000px max)
            const compressedBlob = await compressImage(file, 1000, 1000, 0.8)
            const fileName = `custom-bg-${Date.now()}.jpg`
            const filePath = `banner/${fileName}`
            const { error } = await supabase.storage.from('job-images').upload(filePath, compressedBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600'
            })
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(filePath)

            setBgVal(publicUrl)
        } catch (err: any) {
            alert('업로드 실패: ' + err.message)
        } finally {
            setUploadingBg(false)
        }
    }

    const handleApply = async () => {
        if (!confirm('현재 디자인으로 썸네일(로고)을 저장하시겠습니까?')) return
        setSaving(true)
        try {
            // STEP 1: Fetch the actual Image Blob instead of saving the dynamic URL
            // This prevents massive Vercel usage overhead
            const fullUrl = window.location.origin + previewUrl
            const resBlob = await fetch(fullUrl)
            if (!resBlob.ok) throw new Error('배너 이미지를 생성하는 과정에서 서버 오류가 발생했습니다.')
            const blob = await resBlob.blob()

            // STEP 2a: Compress the generated banner as well
            const compressedBanner = await compressImage(blob, 800, 800, 0.8)

            // STEP 2b: Make it completely STATIC by uploading directly to Supabase
            const supabase = createClient()
            const fileName = `generated-banner-${jobId}-${Date.now()}.jpg`
            const filePath = `banner/${fileName}`
            const { error: upError } = await supabase.storage.from('job-images').upload(filePath, compressedBanner, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true
            })
            if (upError) throw new Error('배너 이미지를 스토리지에 올리는 중 오류가 발생했습니다: ' + upError.message)

            const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(filePath)

            // STEP 3: Save the STATIC string to Database so Vercel doesn't run the API loop for visitors
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: jobId,
                    type: 'JOB_EDIT_LOGO',
                    logo_url: publicUrl
                })
            })
            if (!res.ok) throw new Error('저장 실패')
            alert('성공적으로 적용되었습니다! 이제 과도한 비용이나 트래픽 소모 없이 안정적으로 서비스됩니다.')
            onSuccess(publicUrl)
        } catch (e: any) {
            alert(e.message)
        } finally {
            setSaving(false)
        }
    }

    if (!mounted) return null

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"></div>

            <div className="relative bg-white dark:bg-dark-bg w-full max-w-5xl h-[92vh] max-h-[900px] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-100 dark:border-dark-border animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                {/* PREVIEW AREA (Left) */}
                <div className="w-full md:w-1/2 bg-gray-50 dark:bg-black p-8 flex flex-col items-center justify-center border-r border-gray-100 dark:border-dark-border relative min-h-[400px]">
                    <h3 className="absolute top-4 left-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2"><Wand2 size={14} /> 프리뷰 렌더링</h3>
                    <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-dark-card transition-all relative">
                        <img
                            src={previewUrl}
                            alt="Preview rendering..."
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Ignore errors or show fallback if generating takes time
                            }}
                        />
                    </div>
                </div>

                {/* CONTROLS (Right) */}
                <div className="w-full md:w-1/2 flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-white dark:bg-dark-card sticky top-0 z-10">
                        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2"><Palette className="text-amber-500" /> A.I 커스텀 공방</h2>
                        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-dark-bg rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"><X size={18} className="text-gray-500" /></button>
                    </div>

                    <div className="p-6 space-y-8 flex-1 bg-white dark:bg-dark-card">

                        {/* 1. Background Config */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><ImageIcon size={16} /> 배경 스타일</label>

                            <div className="flex gap-2 mb-2">
                                <button onClick={() => setBgType('IMAGE')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${bgType === 'IMAGE' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-500'}`}>기본 텍스처</button>
                                <button onClick={() => setBgType('SOLID')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${bgType === 'SOLID' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-500'}`}>단색 컬러</button>
                                <button onClick={() => setBgType('CUSTOM')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${bgType === 'CUSTOM' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-500'}`}>내 사진(직접업로드)</button>
                            </div>

                            {bgType === 'IMAGE' && (
                                <select value={bgVal} onChange={e => setBgVal(e.target.value)} className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border font-bold text-sm rounded-xl px-3 py-3 outline-none focus:border-amber-500 cursor-pointer">
                                    {BG_PRESETS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            )}
                            {bgType === 'SOLID' && (
                                <div className="flex bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl px-3 py-2 items-center gap-3">
                                    <input type="color" value={solidColor} onChange={e => setSolidColor(e.target.value)} className="w-10 h-10 rounded shrink-0 cursor-pointer bg-transparent border-0 p-0" />
                                    <span className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300">원하는 색상 직접 선택</span>
                                </div>
                            )}
                            {bgType === 'CUSTOM' && (
                                <label className="flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl cursor-pointer p-5 hover:border-amber-300 transition group relative overflow-hidden">
                                    <Upload size={24} className="text-gray-400 group-hover:text-amber-500 mb-2 transition" />
                                    <span className="text-sm font-bold text-gray-500 group-hover:text-amber-600 select-none">
                                        {uploadingBg ? '이미지 업로드 중...' : '버튼을 눌러 내 사진 파일 고르기'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-1 select-none">최적화를 위해 JPG 또는 PNG 파일만 지원합니다</span>
                                    {bgVal.startsWith('http') && !uploadingBg && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition z-10 backdrop-blur-sm">
                                            [ 사진 새로 고르기 ]
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/jpeg, image/png" onChange={handleImageUpload} disabled={uploadingBg} />
                                </label>
                            )}
                        </div>

                        {/* 2. Typography Config */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Type size={16} /> 폰트 (글씨체)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {FONTS.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFont(f.id)}
                                        className={`py-3 px-2 text-sm font-bold flex flex-col items-center justify-center rounded-xl border-2 transition-all ${font === f.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-500' : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card text-gray-500 hover:border-amber-300'}`}
                                    >
                                        <span>{f.name.split(' ')[0]}</span>
                                        <span className="text-[10px] font-normal opacity-70 mt-1">{f.name.split(' ')[1]} {f.name.split(' ')[2] || ''}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Text Effect Config */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Sparkles size={16} /> 글씨 색상 및 효과</label>
                            <div className="flex gap-2">
                                <div className="flex bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl px-2 py-1 items-center gap-2 shrink-0">
                                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded shrink-0 cursor-pointer bg-transparent border-0 p-0" title="글씨 색상 변경" />
                                </div>
                                <select value={effect} onChange={e => setEffect(e.target.value)} className="flex-1 w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border font-bold text-sm rounded-xl px-3 py-3 outline-none focus:border-amber-500 cursor-pointer">
                                    {EFFECTS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* 4. Text Contents */}
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">글자 내용 & 크기 (최대 250px)</label>

                            <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-2xl space-y-4 border border-gray-100 dark:border-dark-border">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500">첫 번째 줄 (메인)</span>
                                        <span className="text-xs text-amber-500 font-bold">{s1}px</span>
                                    </div>
                                    <input type="text" value={t1} onChange={e => setT1(e.target.value)} placeholder="빈칸 시 숨김" className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border px-3 py-2 text-sm font-bold rounded-xl focus:border-amber-500 outline-none" />
                                    <input type="range" min="30" max="250" value={s1} onChange={e => setS1(parseInt(e.target.value))} className="w-full accent-amber-500" />
                                </div>

                                <div className="space-y-2 border-t border-gray-200 dark:border-dark-border pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500">두 번째 줄 (서브)</span>
                                        <span className="text-xs text-amber-500 font-bold">{s2}px</span>
                                    </div>
                                    <input type="text" value={t2} onChange={e => setT2(e.target.value)} placeholder="빈칸 시 숨김" className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border px-3 py-2 text-sm font-bold rounded-xl focus:border-amber-500 outline-none" />
                                    <input type="range" min="20" max="250" value={s2} onChange={e => setS2(parseInt(e.target.value))} className="w-full accent-amber-500" />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-card flex gap-3 sticky bottom-0 z-10">
                        <button onClick={handleApply} disabled={saving} className="w-full py-4 bg-gradient-to-r from-amber-500 to-purple-500 text-white font-black rounded-xl hover:opacity-90 transition flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 text-base">
                            {saving ? '렌더링 중...' : '현재 디자인으로 저장하기'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
