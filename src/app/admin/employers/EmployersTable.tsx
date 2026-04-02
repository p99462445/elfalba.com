'use client'
import React, { useState } from 'react'
import EmployerEditModal from '@/components/admin/EmployerEditModal'

interface Employer {
    id: string
    business_name: string
    business_number: string | null
    owner_name: string | null
    phone: string | null
    verification_status: string
    created_at: string
    jump_points: number
    user?: {
        phone: string | null
    }
}

export default function EmployersTable({ initialEmployers }: { initialEmployers: any[] }) {
    const [employers, setEmployers] = useState<Employer[]>(initialEmployers)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchFilter, setSearchFilter] = useState('ALL')
    const [loading, setLoading] = useState<string | null>(null)
    const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null)

    const filteredEmployers = employers.filter(emp => {
        if (!searchTerm) return true;
        const searchVal = searchTerm.toLowerCase()
        
        if (searchFilter === 'BIZ_NAME') return emp.business_name.toLowerCase().includes(searchVal)
        if (searchFilter === 'BIZ_NO') return emp.business_number?.includes(searchTerm)
        if (searchFilter === 'NAME') return emp.owner_name?.toLowerCase().includes(searchVal)
        if (searchFilter === 'PHONE') return emp.phone?.includes(searchTerm) || emp.user?.phone?.includes(searchTerm)
        
        return emp.business_name.toLowerCase().includes(searchVal) ||
               emp.business_number?.includes(searchTerm) ||
               emp.owner_name?.toLowerCase().includes(searchVal) ||
               emp.phone?.includes(searchTerm) ||
               emp.user?.phone?.includes(searchTerm)
    })

    const handleAction = async (id: string, status: string) => {
        if (!confirm(`${status === 'APPROVED' ? '승인' : '반려'} 처리하시겠습니까?`)) return

        setLoading(id)
        try {
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type: 'EMPLOYER_VERIFICATION',
                    status
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // UI Update
            setEmployers(prev => prev.map(emp =>
                emp.id === id ? { ...emp, verification_status: status } : emp
            ))
            alert('처리되었습니다.')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(null)
        }
    }

    const handleUpdate = (updated: Employer) => {
        setEmployers(prev => prev.map(emp => emp.id === updated.id ? updated : emp))
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border flex gap-4">
                <div className="relative flex-1 max-w-md flex items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus-within:border-amber-300 transition-all shadow-sm overflow-hidden">
                    <select
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border py-2.5 px-3 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
                    >
                        <option value="ALL">전체</option>
                        <option value="BIZ_NAME">상호명</option>
                        <option value="BIZ_NO">사업자번호</option>
                        <option value="NAME">대표자명</option>
                        <option value="PHONE">연락처</option>
                    </select>
                    <input
                        type="text"
                        placeholder="업소 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-3 pr-4 py-2.5 bg-transparent text-sm font-bold flex-1 outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">검색 결과:</span>
                    <span className="text-xs font-black text-amber-500">{filteredEmployers.length}업체</span>
                </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300">
                        <th className="p-3 font-semibold text-sm">업체명</th>
                        <th className="p-3 font-semibold text-sm">사업자번호</th>
                        <th className="p-3 font-semibold text-sm">대표자명</th>
                        <th className="p-3 font-semibold text-sm">연락처</th>
                        <th className="p-3 font-semibold text-sm">점프포인트</th>
                        <th className="p-3 font-semibold text-sm">승인 상태</th>
                        <th className="p-3 font-semibold text-sm">가입일</th>
                        <th className="p-3 font-semibold text-sm text-right">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredEmployers.length === 0 && (
                        <tr>
                            <td colSpan={8} className="p-10 text-center text-gray-500 font-medium">
                                검색 결과가 없거나 등록된 업소가 없습니다.
                            </td>
                        </tr>
                    )}
                    {filteredEmployers.map(emp => (
                        <tr key={emp.id} className="border-b dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                            <td className="p-3">
                                <p className="font-bold text-gray-800 dark:text-gray-100">{emp.business_name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{emp.id}</p>
                            </td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{emp.business_number || '-'}</td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{emp.owner_name || '-'}</td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{emp.phone || emp.user?.phone || '-'}</td>
                            <td className="p-3 text-sm font-black text-amber-500">{(emp.jump_points || 0).toLocaleString()}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${emp.verification_status === 'APPROVED' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                                    emp.verification_status === 'REJECTED' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                                        'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 shadow-sm shadow-yellow-100 dark:shadow-none border border-yellow-200 dark:border-yellow-900/50 animate-pulse'
                                    }`}>
                                    {emp.verification_status === 'APPROVED' ? '승인완료' : emp.verification_status === 'REJECTED' ? '반려됨' : '심사대기'}
                                </span>
                            </td>
                            <td className="p-3 text-gray-400 dark:text-gray-500 text-[12px]">{new Date(emp.created_at).toLocaleDateString()}</td>
                            <td className="p-3 space-x-2 text-right">
                                <button
                                    onClick={() => setEditingEmployer(emp)}
                                    className="bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-dark-card transition-all"
                                >
                                    수정
                                </button>
                                {emp.verification_status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(emp.id, 'APPROVED')}
                                            disabled={loading === emp.id}
                                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            승인
                                        </button>
                                        <button
                                            onClick={() => handleAction(emp.id, 'REJECTED')}
                                            disabled={loading === emp.id}
                                            className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            반려
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingEmployer && (
                <EmployerEditModal
                    employer={editingEmployer}
                    onClose={() => setEditingEmployer(null)}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
        </div>
    )
}
