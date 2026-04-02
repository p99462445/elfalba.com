'use client'
import React, { useState } from 'react'

export default function CategoryManager({ initialItems, type }: { initialItems: any[], type: 'CATEGORY' | 'REGION' }) {
    const [items, setItems] = useState(initialItems)
    const [newItem, setNewItem] = useState({ name: '', slug: '' })
    const [loading, setLoading] = useState(false)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.name || !newItem.slug) return

        setLoading(true)
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newItem, type })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setItems(prev => [...prev, data.item])
            setNewItem({ name: '', slug: '' })
            alert('등록되었습니다.')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까? 관련 공고가 있는 경우 오류가 발생할 수 있습니다.')) return

        try {
            const res = await fetch(`/api/admin/categories?id=${id}&type=${type}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error)
            }
            setItems(prev => prev.filter(it => it.id !== id))
            alert('삭제되었습니다.')
        } catch (err: any) {
            alert(err.message)
        }
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    placeholder="이름 (예: 강남)"
                    value={newItem.name}
                    onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-amber-300 transition text-gray-900 dark:text-gray-100"
                />
                <input
                    placeholder="Slug (예: gangnam)"
                    value={newItem.slug}
                    onChange={e => setNewItem(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-amber-300 transition font-mono text-gray-900 dark:text-gray-100"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2.5 ${type === 'CATEGORY' ? 'bg-gray-900 dark:bg-gray-100 dark:text-dark-bg border border-gray-900 dark:border-gray-100 text-white' : 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 border-gray-200 dark:border-dark-border'} rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-lg dark:shadow-none`}>
                    {loading ? '추가 중...' : '추가'}
                </button>
            </form>

            <div className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-white dark:border-dark-border group hover:bg-white dark:hover:bg-dark-card hover:border-gray-100 dark:hover:border-dark-border transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className="text-[14px] font-black text-gray-800 dark:text-gray-100 tracking-tight">{item.name}</span>
                            <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase font-mono bg-white dark:bg-dark-card px-2 py-0.5 rounded-lg border border-gray-50 dark:border-dark-border transition group-hover:bg-gray-50 dark:group-hover:bg-dark-bg">{item.slug}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold bg-gray-100 dark:bg-dark-bg px-2 py-0.5 rounded-lg">공고 {item._count?.jobs || 0}</span>
                        </div>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-300 dark:text-red-900/50 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                        >
                            삭제
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
