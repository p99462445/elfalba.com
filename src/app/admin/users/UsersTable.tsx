'use client'
import React, { useState } from 'react'
import UserInfoModal from '@/components/admin/UserInfoModal'

interface User {
    id: string
    email: string
    name: string | null
    nickname: string | null
    phone: string | null
    birthdate: string | null
    role: string
    status: string
    created_at: string
    old_id: string | null
}

export default function UsersTable({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [activeTab, setActiveTab] = useState<'ALL' | 'NEW'>('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const [searchFilter, setSearchFilter] = useState('ALL')
    const [loading, setLoading] = useState<string | null>(null)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    const filteredUsers = users.filter(user => {
        // Tab Filter
        if (activeTab === 'NEW' && user.old_id !== null) return false;

        // Search Filter
        if (!searchTerm) return true;
        const searchVal = searchTerm.toLowerCase()
        
        if (searchFilter === 'USER_ID') return user.email.toLowerCase().includes(searchVal)
        if (searchFilter === 'NAME') return user.name?.toLowerCase().includes(searchVal) || user.nickname?.toLowerCase().includes(searchVal)
        if (searchFilter === 'PHONE') return user.phone?.includes(searchTerm)
        
        return user.email.toLowerCase().includes(searchVal) ||
               user.name?.toLowerCase().includes(searchVal) ||
               user.phone?.includes(searchTerm) ||
               user.nickname?.toLowerCase().includes(searchVal)
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)

    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, activeTab])

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const pageGroupSize = 10;
    const currentGroup = Math.ceil(currentPage / pageGroupSize);
    const startPage = Math.max(1, (currentGroup - 1) * pageGroupSize + 1);
    const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
    const pagesInGroup = Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i);

    const handleAction = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE'
        const actionLabel = newStatus === 'BANNED' ? '정지' : '해제'
        if (!confirm(`회원을 ${actionLabel} 처리하시겠습니까?`)) return

        setLoading(id)
        try {
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type: 'USER_STATUS',
                    status: newStatus
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setUsers(prev => prev.map(user =>
                user.id === id ? { ...user, status: newStatus } : user
            ))
            alert(`회원이 ${actionLabel}되었습니다.`)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-0">
            {/* Tabs Design */}
            <div className="flex bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border">
                {[
                    { id: 'ALL', label: '전체 회원' },
                    { id: 'NEW', label: '신규 회원 (이사가 아닌 가입)' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 text-sm font-black transition-all relative ${
                            activeTab === tab.id 
                                ? 'text-amber-500 bg-amber-50/30 dark:bg-pink-900/10' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
                        )}
                        {tab.id === 'NEW' && (
                             <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-pink-900/30 text-[10px] text-amber-600">
                                {users.filter(u => u.old_id === null).length}
                             </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border flex gap-4">
                <div className="relative flex-1 max-w-md flex items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus-within:border-amber-300 transition-all shadow-sm overflow-hidden">
                    <select
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border py-2.5 px-3 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
                    >
                        <option value="ALL">전체</option>
                        <option value="USER_ID">가입ID(이메일)</option>
                        <option value="NAME">이름/닉네임</option>
                        <option value="PHONE">전화번호</option>
                    </select>
                    <input
                        type="text"
                        placeholder="검색어 입력..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-3 pr-4 py-2.5 bg-transparent text-sm font-bold flex-1 outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold">보기:</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className="bg-white dark:bg-dark-bg border dark:border-dark-border hover:border-amber-300 rounded text-xs px-1 py-0.5 outline-none font-bold"
                        >
                            {[10, 20, 30, 40, 50, 100].map(n => (
                                <option key={n} value={n}>{n}명씩</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{activeTab === 'NEW' ? '신규 회원 수:' : '검색 결과:'}</span>
                        <span className="text-xs font-black text-amber-500">{filteredUsers.length}명</span>
                    </div>
                </div>
            </div>

            {selectedUserId && (
                <UserInfoModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300">
                            <th className="p-4 font-bold text-sm">실명 / 가입정보</th>
                            <th className="p-4 font-bold text-sm">연락처 / 생년월일</th>
                            <th className="p-4 font-bold text-sm">닉네임</th>
                            <th className="p-4 font-bold text-sm text-center">권한</th>
                            <th className="p-4 font-bold text-sm text-center">상태</th>
                            <th className="p-4 font-bold text-sm text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr key={user.id} className="border-b dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                                <td className="p-4">
                                    <p
                                        className="font-black text-gray-900 dark:text-gray-100 cursor-pointer hover:text-amber-500 transition-colors"
                                        onClick={() => setSelectedUserId(user.id)}
                                    >
                                        {user.name || '(미인증)'}
                                    </p>
                                    <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                                        {user.email.endsWith('@elfalba.com') ? user.email.replace('@elfalba.com', '') : user.email}
                                    </p>
                                    <p
                                        className="text-[10px] text-gray-400 dark:text-gray-600 font-mono mt-0.5 select-all cursor-pointer hover:text-black dark:hover:text-white"
                                        onClick={() => setSelectedUserId(user.id)}
                                    >
                                        {user.id}
                                    </p>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm font-black text-gray-800 dark:text-gray-200">{user.phone || '-'}</p>
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1">🎂 {user.birthdate || '-'}</p>
                                </td>
                                <td className="p-4 text-sm font-bold text-gray-600 dark:text-gray-400">{user.nickname || '-'}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' :
                                        user.role === 'EMPLOYER' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                                            'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {user.role === 'ADMIN' ? '관리자' : user.role === 'EMPLOYER' ? '업소' : '일반'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${user.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                                        'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                                        }`}>
                                        {user.status === 'ACTIVE' ? '정상' : '정지'}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => setSelectedUserId(user.id)}
                                        className="px-4 py-2 bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white rounded-xl text-[11px] font-black transition-all active:scale-95 shadow-lg shadow-gray-200 dark:shadow-none"
                                    >
                                        수정
                                    </button>
                                    {user.role !== 'ADMIN' && (
                                        <button
                                            onClick={() => handleAction(user.id, user.status)}
                                            disabled={loading === user.id}
                                            className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 disabled:opacity-50 ${user.status === 'ACTIVE'
                                                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/30'
                                                : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/30'
                                                }`}
                                        >
                                            {user.status === 'ACTIVE' ? '정지' : '해제'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paginatedUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-20 text-center text-gray-400 dark:text-gray-500 font-bold">검색 결과가 없거나 회원이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-6 flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border rounded-b-2xl">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                        title="첫 페이지"
                    >
                        &laquo;
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                    >
                        이전
                    </button>
                    {pagesInGroup.map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-black transition-all flex items-center justify-center shrink-0 ${currentPage === page ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                    >
                        다음
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                        title="마지막 페이지"
                    >
                        &raquo;
                    </button>
                </div>
            )}
        </div>
    )
}
