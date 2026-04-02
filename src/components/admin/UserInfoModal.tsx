'use client'
import React, { useEffect, useState } from 'react'
import { X, User, Phone, Calendar, Mail, Shield, MapPin, Briefcase, CreditCard, MessageSquare } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function UserInfoModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        nickname: '',
        phone: '',
        role: '',
        jump_points: 0,
        password: ''
    })
    const [updating, setUpdating] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (userId) fetchUser()
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [userId])

    const fetchUser = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}`)
            const data = await res.json()
            if (res.ok) {
                setUser(data)
                setEditForm({
                    name: data.name || '',
                    nickname: data.nickname || '',
                    phone: data.phone || '',
                    role: data.role,
                    jump_points: data.employer?.jump_points || 0,
                    password: ''
                })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (editForm.password && editForm.password.length < 6) {
            return alert('비밀번호는 최소 6자 이상이어야 합니다.')
        }

        setUpdating(true)
        try {
            // 1. Basic User Info Update + Password
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    nickname: editForm.nickname,
                    phone: editForm.phone,
                    role: editForm.role,
                    password: editForm.password || undefined // Only send if filled
                })
            })
            if (!res.ok) throw new Error('회원 정보 수정 실패')

            // 2. Jump Points Update (if employer)
            if (user.employer && editForm.jump_points !== user.employer.jump_points) {
                const jumpRes = await fetch('/api/admin/action', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: userId,
                        type: 'EMPLOYER_JUMP_EDIT',
                        jumpPoints: editForm.jump_points
                    })
                })
                if (!jumpRes.ok) throw new Error('점프 포인트 수정 실패')
            }

            alert('정보가 수정되었습니다.')
            setIsEditing(false)
            fetchUser() // Refresh data
        } catch (err: any) {
            alert(err.message)
        } finally {
            setUpdating(false)
        }
    }

    if (!mounted || !userId) return null

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className="bg-white dark:bg-dark-card w-full max-w-4xl max-h-[92vh] rounded-[40px] shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-black text-gray-400">회원 정보를 불러오는 중...</p>
                    </div>
                ) : user ? (
                    <>
                        {/* Compact Header Section */}
                        <div className="p-8 bg-gray-900 dark:bg-dark-bg text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/20 to-transparent"></div>

                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-20 group"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>

                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-20 h-20 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
                                    <User size={40} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-black tracking-tighter">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.name}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="bg-white/10 dark:bg-dark-card/50 border border-white/20 dark:border-dark-border rounded-xl px-4 py-1 text-2xl outline-none focus:ring-4 focus:ring-amber-500/50 text-white w-full max-w-xs"
                                                    placeholder="실명 입력"
                                                />
                                            ) : (user.name || '(이름미등록)')}
                                        </h2>
                                        <span className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-500 shadow-lg shadow-purple-500/20' :
                                            user.role === 'EMPLOYER' ? 'bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-gray-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-5 text-gray-400 font-bold text-sm">
                                        <div className="flex items-center gap-2 border-r border-white/10 pr-5">
                                            <Mail size={14} />
                                            <span>{user.email?.endsWith('@elfalba.com') ? user.email.replace('@elfalba.com', '') : user.email}</span>
                                        </div>
                                        {user.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} />
                                                <span>{user.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Body Section */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-8">
                                    <div>
                                        <SectionTitle title="관리 상세 정보" color="bg-amber-500" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-4">
                                            <DetailItem label="닉네임" value={isEditing ? (
                                                <input
                                                    value={editForm.nickname}
                                                    onChange={e => setEditForm({ ...editForm, nickname: e.target.value })}
                                                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                                                />
                                            ) : (user.nickname || '-')} />
                                            <DetailItem label="생년월일" value={user.birthdate || '-'} />
                                            <DetailItem label="계정상태" value={user.status === 'ACTIVE' ? (
                                                <span className="text-green-500">운영 중</span>
                                            ) : (
                                                <span className="text-red-500">활동 정지</span>
                                            )} />
                                            <DetailItem label="가입일" value={new Date(user.created_at).toLocaleDateString() + ' (' + new Date(user.created_at).toLocaleTimeString() + ')'} />
                                            
                                            {isEditing && (
                                                <div className="md:col-span-2 p-5 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                                    <label className="block text-[11px] font-black text-amber-500 uppercase tracking-widest mb-2 ml-1">🔒 비밀번호 강제 변경</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.password}
                                                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                                        placeholder="변경할 새 비밀번호를 입력하세요 (미입력 시 유지)"
                                                        className="w-full bg-white dark:bg-dark-bg border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-amber-500/20 text-sm"
                                                    />
                                                    <p className="text-[10px] text-amber-400 font-bold mt-2 ml-1">* 입력 즉시 해당 유저의 로그인 비밀번호가 변경됩니다. 신중하게 입력하세요.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatCard label="작성 게시글" count={user._count.posts} />
                                        <StatCard label="작성 댓글" count={user._count.comments} />
                                        <StatCard label="지원 내역" count={user._count.applications} />
                                        <StatCard label="결제 내역" count={user._count.payments} />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <SectionTitle title="사업자 및 포인트" color="bg-blue-500" />
                                        {user.employer ? (
                                            <div className="bg-gray-50 dark:bg-dark-bg rounded-[32px] p-6 border border-gray-100 dark:border-dark-border space-y-6 mt-4">
                                                <DetailItem label="등록 업소명" value={user.employer.business_name} />
                                                <DetailItem label="사업자 번호" value={user.employer.business_number || '-'} />
                                                <div className="pt-5 border-t border-gray-200 dark:border-dark-border">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">보유 점프 포인트</p>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                 <input
                                                                    type="number"
                                                                    value={editForm.jump_points}
                                                                    onChange={e => setEditForm({ ...editForm, jump_points: parseInt(e.target.value) })}
                                                                    className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/20"
                                                                />
                                                                <span className="text-xs font-bold text-gray-400">P</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xl font-black text-blue-600">{user.employer.jump_points?.toLocaleString() || 0}</span>
                                                                <span className="text-[11px] font-bold text-gray-400">P</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 leading-relaxed font-bold">전체 매장에서 공유하는 코인입니다.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-100 dark:border-dark-border rounded-[32px] text-gray-300 font-black text-center gap-2">
                                                <Briefcase size={32} className="opacity-30" />
                                                <p className="text-xs">기업 회원 정보가 <br /> 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer Section */}
                        <div className="p-8 bg-gray-50/80 dark:bg-dark-bg/80 backdrop-blur-md border-t border-gray-100 dark:border-dark-border flex justify-end gap-4 shrink-0">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={() => setIsEditing(false)} 
                                        className="px-8 py-3.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl font-black text-sm text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
                                    >
                                        취소
                                    </button>
                                    <button 
                                        onClick={handleUpdate} 
                                        disabled={updating} 
                                        className="px-14 py-3.5 bg-gradient-to-r from-amber-500 to-purple-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {updating ? '동기화 중...' : '변경사항 저장하기'}
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="px-14 py-3.5 bg-gray-950 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    회원 정보 수정하기
                                </button>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}

function SectionTitle({ title, color }: { title: string, color: string }) {
    return (
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <div className={`w-1 h-3 ${color} rounded-full`}></div>
            {title}
        </h3>
    )
}

function DetailItem({ label, value }: { label: string, value: any }) {
    return (
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{label}</p>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{value}</div>
        </div>
    )
}

function StatCard({ label, count }: { label: string, count: number }) {
    return (
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-4 text-center shadow-sm">
            <p className="text-[10px] font-black text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{count}</p>
        </div>
    )
}
