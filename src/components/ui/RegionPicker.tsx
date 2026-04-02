'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X, ChevronDown } from 'lucide-react'

interface RegionParent {
    id: number
    name: string
    slug: string
    children: { id: number; name: string; slug: string }[]
}

interface SelectedRegion {
    parentSlug: string
    childSlug: string
    parentName: string
    childName: string
}

interface RegionPickerProps {
    regions: RegionParent[]
    value: string[]
    onChange: (slugs: string[]) => void
}

const ITEM_H = 46

// ─── Drum Picker ──────────────────────────────────────────────────────────────
function Drum({
    items,
    selectedIndex,
    onSelect,
    disabled,
}: {
    items: { label: string; value: string }[]
    selectedIndex: number
    onSelect: (index: number) => void
    disabled?: boolean
}) {
    const [offset, setOffset] = useState(0)
    const isDragging = useRef(false)
    const startY = useRef(0)
    const startOffset = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync offset when selectedIndex changes from outside (only when NOT dragging)
    useEffect(() => {
        if (!isDragging.current) {
            setOffset(-selectedIndex * ITEM_H)
        }
    }, [selectedIndex])

    const clampIndex = (idx: number) => Math.max(0, Math.min(idx, items.length - 1))

    const snapToIndex = useCallback((rawOffset: number) => {
        const idx = clampIndex(Math.round(-rawOffset / ITEM_H))
        setOffset(-idx * ITEM_H)
        onSelect(idx)
    }, [items.length, onSelect])

    // ── Pointer (mouse + touch) ──
    const onPointerDown = (e: React.PointerEvent) => {
        if (disabled) return
        isDragging.current = true
        startY.current = e.clientY
        startOffset.current = offset
        containerRef.current?.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || disabled) return
        const dy = e.clientY - startY.current
        const raw = startOffset.current + dy
        // Soft boundary resistance
        const min = -(items.length - 1) * ITEM_H
        const bounded = raw < min ? min + (raw - min) * 0.2 : raw > 0 ? raw * 0.2 : raw
        setOffset(bounded)
    }

    const onPointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return
        isDragging.current = false
        snapToIndex(offset)
    }

    // ── Wheel ──
    const onWheel = (e: React.WheelEvent) => {
        if (disabled) return
        e.preventDefault()
        const newIdx = clampIndex(selectedIndex + (e.deltaY > 0 ? 1 : -1))
        setOffset(-newIdx * ITEM_H)
        onSelect(newIdx)
    }

    if (disabled || items.length === 0) {
        return (
            <div
                className="flex-1 flex items-center justify-center text-[13px] text-gray-300 dark:text-gray-700 font-bold select-none"
                style={{ height: 5 * ITEM_H }}
            >
                {disabled ? '대분류를 먼저 선택하세요' : '항목 없음'}
            </div>
        )
    }

    const translateY = offset + 2 * ITEM_H

    return (
        <div
            ref={containerRef}
            className="relative select-none touch-none cursor-grab active:cursor-grabbing"
            style={{ height: 5 * ITEM_H, overflow: 'hidden' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
        >
            {/* Top fade */}
            <div className="absolute inset-x-0 top-0 z-20 pointer-events-none bg-gradient-to-b from-white dark:from-dark-card to-transparent"
                style={{ height: 2 * ITEM_H }} />

            {/* Center highlight - Added z-0 to keep it behind text */}
            <div className="absolute inset-x-3 z-0 pointer-events-none rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50"
                style={{ top: 2 * ITEM_H, height: ITEM_H }} />

            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none bg-gradient-to-t from-white dark:from-dark-card to-transparent"
                style={{ height: 2 * ITEM_H }} />

            {/* Items - z-10 ensures visibility over the highlight */}
            <div
                className="relative z-10"
                style={{
                    transform: `translateY(${translateY}px)`,
                    transition: isDragging.current ? 'none' : 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
                    willChange: 'transform',
                }}
            >
                {items.map((item, i) => {
                    const dist = Math.abs(i - selectedIndex)
                    const scale = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.76
                    const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : 0.25
                    return (
                        <div
                            key={item.value}
                            onClick={() => { if (!isDragging.current) { setOffset(-i * ITEM_H); onSelect(i) } }}
                            style={{ height: ITEM_H, transform: `scale(${scale})`, opacity, transition: 'transform 0.15s, opacity 0.15s' }}
                            className={`flex items-center justify-center px-4 ${i === selectedIndex ? 'text-amber-600 dark:text-amber-400 font-black text-[15px]' : 'text-gray-500 dark:text-gray-400 font-bold text-[13px]'}`}
                        >
                            <span className="truncate text-center leading-tight">{item.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Slot Picker ───────────────────────────────────────────────────────────────
function SlotPicker({
    regions,
    value,
    onSelect,
    onRemove,
    slotIndex,
}: {
    regions: RegionParent[]
    value: SelectedRegion | null
    onSelect: (r: SelectedRegion) => void
    onRemove: () => void
    slotIndex: number
}) {
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState<'parent' | 'child'>('parent')
    const [parentIdx, setParentIdx] = useState(0)
    const [childIdx, setChildIdx] = useState(0)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Scroll Lock when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    const parentItems = regions.map(r => ({ label: r.name, value: r.slug }))
    const selectedParent = regions[parentIdx]
    const childItems = selectedParent?.children.map(c => ({ label: c.name, value: c.slug })) || []

    const handleParentSelect = (idx: number) => {
        setParentIdx(idx)
        setChildIdx(0)
    }

    const handleConfirm = () => {
        if (!selectedParent || childItems.length === 0) return
        const child = selectedParent.children[childIdx]
        onSelect({
            parentSlug: selectedParent.slug,
            childSlug: child.slug,
            parentName: selectedParent.name,
            childName: child.name,
        })
        setOpen(false)
    }

    const labels = ['1지역', '2지역', '3지역']

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all active:scale-[0.98] ${value ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20' : 'border-dashed border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg hover:border-amber-200 dark:hover:border-amber-900/30'}`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-gray-400 dark:text-gray-600 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border px-2 py-0.5 rounded-full">{labels[slotIndex]}</span>
                    {value ? (
                        <span className="text-[14px] font-black text-gray-800 dark:text-gray-100">
                            {value.parentName} · <span className="text-amber-600 dark:text-amber-400">{value.childName}</span>
                        </span>
                    ) : (
                        <span className="text-[13px] text-gray-400 dark:text-gray-600 font-bold flex items-center gap-1.5">
                            <MapPin size={13} className="text-gray-300 dark:text-gray-700" />
                            지역 선택
                        </span>
                    )}
                </div>
                {value ? (
                    <button type="button" onClick={e => { e.stopPropagation(); onRemove() }}
                        className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-400 dark:text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition">
                        <X size={12} />
                    </button>
                ) : (
                    <ChevronDown size={16} className="text-gray-300 dark:text-gray-700" />
                )}
            </button>

            {mounted && open && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-auto">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative bg-white dark:bg-dark-card rounded-t-[32px] shadow-2xl safe-bottom max-h-[90vh] flex flex-col">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1.5 bg-gray-200 dark:bg-dark-border rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 shrink-0">
                            <h3 className="text-[17px] font-black text-gray-900 dark:text-gray-100">{labels[slotIndex]} 선택</h3>
                            <button onClick={() => setOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 px-4 pb-3 shrink-0">
                            <button type="button" onClick={() => setTab('parent')}
                                className={`flex-1 h-10 rounded-xl text-[13px] font-black transition-all ${tab === 'parent' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-dark-bg' : 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-600'}`}>
                                대분류
                            </button>
                            <button type="button" onClick={() => setTab('child')}
                                className={`flex-1 h-10 rounded-xl text-[13px] font-black transition-all ${tab === 'child' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-600'}`}>
                                소분류
                                {selectedParent && <span className="ml-1 opacity-70 text-[10px]">({selectedParent.name})</span>}
                            </button>
                        </div>

                        {/* Drum */}
                        <div className="px-2 border-t border-gray-50 dark:border-dark-border flex-1 min-h-[5*46px]">
                            {tab === 'parent' ? (
                                <Drum items={parentItems} selectedIndex={parentIdx} onSelect={handleParentSelect} />
                            ) : (
                                <Drum items={childItems} selectedIndex={childIdx} onSelect={setChildIdx} disabled={childItems.length === 0} />
                            )}
                        </div>

                        {/* Preview bar */}
                        <div className="flex items-center justify-center gap-2 py-2 border-t border-gray-50 dark:border-dark-border shrink-0">
                            <span className={`text-[13px] font-bold ${tab === 'parent' ? 'text-gray-900 dark:text-gray-100 font-black' : 'text-gray-400 dark:text-gray-600'}`}>
                                {parentItems[parentIdx]?.label || '-'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700 text-sm">·</span>
                            <span className={`text-[13px] font-bold ${tab === 'child' ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-gray-300 dark:text-gray-700'}`}>
                                {childItems[childIdx]?.label || '소분류 선택'}
                            </span>
                        </div>

                        {/* Confirm */}
                        <div className="px-4 py-4 shrink-0 pb-10">
                            <button type="button" onClick={handleConfirm}
                                disabled={childItems.length === 0 || tab === 'parent'}
                                className="w-full h-12 bg-amber-500 text-white rounded-2xl font-black text-[15px] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center shadow-lg shadow-amber-100 dark:shadow-none">
                                선택 완료 — {parentItems[parentIdx]?.label}{childItems[childIdx]?.label ? ` · ${childItems[childIdx].label}` : ''}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function RegionPicker({ regions, value, onChange }: RegionPickerProps) {
    const allChildren = regions.flatMap(p =>
        p.children.map(c => ({ ...c, parentSlug: p.slug, parentName: p.name }))
    )

    const getRegion = (slug: string): SelectedRegion | null => {
        const c = allChildren.find(c => c.slug === slug)
        if (!c) return null
        return { parentSlug: c.parentSlug, childSlug: c.slug, parentName: c.parentName, childName: c.name }
    }

    const slots: (SelectedRegion | null)[] = [
        value[0] ? getRegion(value[0]) : null,
        value[1] ? getRegion(value[1]) : null,
        value[2] ? getRegion(value[2]) : null,
    ]

    const handleSelect = (slotIdx: number, region: SelectedRegion) => {
        const next = [...value]
        next[slotIdx] = region.childSlug
        // Deduplicate
        const deduped: string[] = []
        for (const s of next) {
            if (s && !deduped.includes(s)) deduped.push(s)
        }
        onChange(deduped)
    }

    const handleRemove = (slotIdx: number) => {
        const next = [...value]
        next.splice(slotIdx, 1)
        onChange(next)
    }

    return (
        <div className="space-y-2.5">
            {[0, 1, 2].map(i => (
                <SlotPicker
                    key={i}
                    regions={regions}
                    value={slots[i]}
                    onSelect={r => handleSelect(i, r)}
                    onRemove={() => handleRemove(i)}
                    slotIndex={i}
                />
            ))}
        </div>
    )
}
