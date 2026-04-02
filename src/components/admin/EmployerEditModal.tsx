'use client'
import React, { useState } from 'react'
import { X } from 'lucide-react'

interface EmployerEditModalProps {
    employer: any
    onClose: () => void
    onUpdate: (updated: any) => void
}

export default function EmployerEditModal({ employer, onClose, onUpdate }: EmployerEditModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [form, setForm] = useState({
        business_name: employer.business_name || '',
        business_number: employer.business_number || '',
        owner_name: employer.owner_name || '',
        phone: employer.phone || '',
        jump_points: employer.jump_points || 0
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: name === 'jump_points' ? parseInt(value) || 0 : value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: employer.id,
                    type: 'EMPLOYER_DATA_EDIT',
                    ...form
                })
            })
            if (!res.ok) throw new Error('수정에 실패했습니다.')

            alert('회원정보가 수정되었습니다.')
            onUpdate({ ...employer, ...form })
            onClose()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border">
                <header className="p-6 border-b dark:border-dark-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">🏢 회원정보 수정</h2>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">업소 기본 정보를 변경합니다.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">상호명</label>
                            <input name="business_name" type="text" value={form.business_name} onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-4 text-sm font-bold focus:border-amber-300 outline-none transition-all" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">대표자명</label>
                                <input name="owner_name" type="text" value={form.owner_name} onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-4 text-sm font-bold focus:border-amber-300 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">연락처</label>
                                <input name="phone" type="text" value={form.phone} onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-4 text-sm font-bold focus:border-amber-300 outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">사업자번호</label>
                            <input name="business_number" type="text" value={form.business_number} onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-4 text-sm font-bold focus:border-amber-300 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">점프 포인트</label>
                            <input name="jump_points" type="number" value={form.jump_points} onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-4 text-sm font-bold focus:border-amber-300 outline-none transition-all text-amber-500" />
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading}
                        className="w-full h-15 bg-amber-500 text-white rounded-2xl font-black text-[16px] hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-100 dark:shadow-none">
                        {isLoading ? '저장 중...' : '변경사항 저장하기'}
                    </button>
                </form>
            </div>
        </div>
    )
}
