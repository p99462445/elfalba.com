'use client'
import React, { useState } from 'react'
import { Crown, Star, Zap, Save, Edit2, X, Check } from 'lucide-react'

const TIER_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
    VVIP_SLOT: { icon: <Crown size={18} />, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: '프리미엄' },
    VIP_SLOT: { icon: <Star size={18} />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: '추천' },
    GENERAL_SLOT: { icon: <Zap size={18} />, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: '일반' },
    JUMP_COIN: { icon: <Zap size={18} />, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: '점프코인' },
}

export default function ProductManager({ initialProducts }: { initialProducts: any[] }) {
    const [products, setProducts] = useState(initialProducts)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [loading, setLoading] = useState<string | null>(null)

    const startEdit = (p: any) => {
        setEditingId(p.id)
        setEditForm({
            name: p.name,
            price: p.price,
            jump_count: p.jump_count || '',
            duration_days: p.duration_days || '',
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditForm({})
    }

    const handleSave = async (id: string) => {
        setLoading(id)
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name: editForm.name,
                    price: Number(editForm.price),
                    jump_count: editForm.jump_count ? Number(editForm.jump_count) : null,
                    duration_days: editForm.duration_days ? Number(editForm.duration_days) : null,
                })
            })
            if (!res.ok) throw new Error('업데이트 실패')

            setProducts(prev => prev.map(p => p.id === id ? {
                ...p,
                name: editForm.name,
                price: Number(editForm.price),
                jump_count: editForm.jump_count ? Number(editForm.jump_count) : null,
                duration_days: editForm.duration_days ? Number(editForm.duration_days) : null,
            } : p))
            setEditingId(null)
            setEditForm({})
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {products.map(p => {
                const meta = TIER_META[p.product_type] || TIER_META['GENERAL_SLOT']
                const isEditing = editingId === p.id

                return (
                    <div key={p.id} className={`rounded-[24px] border-2 ${meta.border} ${meta.bg} p-5`}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className={`flex items-center gap-2 ${meta.color}`}>
                                {meta.icon}
                                <span className="text-[11px] font-black uppercase tracking-widest">{meta.label}</span>
                            </div>
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSave(p.id)}
                                        disabled={loading === p.id}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white transition ${loading === p.id ? 'opacity-50' : 'hover:bg-green-600'}`}
                                    >
                                        {loading === p.id ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                                    </button>
                                    <button onClick={cancelEdit} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 hover:bg-gray-300 transition">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition">
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </div>

                        {/* Product Name */}
                        {isEditing ? (
                            <input
                                value={editForm.name}
                                onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[14px] font-black text-gray-800 outline-none focus:border-amber-400 mb-4"
                                placeholder="상품명"
                            />
                        ) : (
                            <p className="font-black text-xl text-gray-900 mb-4">{p.name}</p>
                        )}

                        {/* Price */}
                        <div className="mb-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">가격 (원)</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={e => setEditForm((f: any) => ({ ...f, price: e.target.value }))}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[14px] font-black text-amber-500 outline-none focus:border-amber-400"
                                />
                            ) : (
                                <p className={`text-2xl font-black ${meta.color}`}>{p.price.toLocaleString()}원</p>
                            )}
                        </div>

                        {/* Jump Count */}
                        <div className="mb-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">점프 횟수</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={editForm.jump_count}
                                    onChange={e => setEditForm((f: any) => ({ ...f, jump_count: e.target.value }))}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[14px] font-bold text-gray-700 outline-none focus:border-amber-400"
                                    placeholder="없으면 비워두세요"
                                />
                            ) : (
                                <p className="font-bold text-gray-700 text-[14px]">{p.jump_count ? `${p.jump_count.toLocaleString()}회` : '-'}</p>
                            )}
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">기간 (일)</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={editForm.duration_days}
                                    onChange={e => setEditForm((f: any) => ({ ...f, duration_days: e.target.value }))}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[14px] font-bold text-gray-700 outline-none focus:border-amber-400"
                                    placeholder="없으면 비워두세요"
                                />
                            ) : (
                                <p className="font-bold text-gray-700 text-[14px]">{p.duration_days ? `${p.duration_days}일` : '-'}</p>
                            )}
                        </div>
                    </div>
                )
            })}

            {products.length === 0 && (
                <div className="col-span-3 p-16 text-center text-gray-400 font-bold text-sm border-2 border-dashed border-gray-200 rounded-[24px]">
                    등록된 상품이 없습니다.<br />
                    <span className="text-[12px] font-normal text-gray-300">/api/seed-products 호출로 초기 상품을 생성하세요.</span>
                </div>
            )}
        </div>
    )
}
