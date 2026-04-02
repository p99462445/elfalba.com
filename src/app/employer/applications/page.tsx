'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, MessageSquare, Clock, CheckCircle, XCircle, Search } from 'lucide-react'

export default function EmployerApplicationsPage() {
    const [loading, setLoading] = useState(true)
    const [applications, setApplications] = useState<any[]>([])

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/employer/applications')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setApplications(data.applications)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [])

    const handleStatusUpdate = async (appId: string, status: string) => {
        try {
            const res = await fetch(`/api/employer/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if (!res.ok) throw new Error('Failed to update status')
            fetchApplications()
        } catch (err: any) {
            alert(err.message)
        }
    }

    return (
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-dark-bg text-gray-800 dark:text-gray-100 font-sans pb-28">
            {/* Nav */}
            <nav className="sticky top-0 z-[2000] bg-[#f59e0b] shadow-lg px-6 h-16 flex items-center gap-4 text-white">
                <Link href="/employer" className="p-2 hover:bg-white/10 rounded-full transition">
                    <ArrowLeft size={22} />
                </Link>
                <h1 className="text-lg font-black tracking-tighter uppercase">지원 현황</h1>
            </nav>

            <main className="max-w-xl mx-auto px-6 mt-10">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8 pl-1">
                            <h2 className="text-[14px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
                                새로운 지원자 <span className="text-amber-500">{applications.filter(a => a.status === 'NEW').length}</span>
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {applications.map(app => (
                                <div key={app.id} className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[30px] p-6 hover:border-amber-100 dark:hover:border-pink-900/30 transition shadow-sm">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-amber-50 dark:bg-pink-950/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm dark:shadow-none">
                                                <User size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">{app.user.email.split('@')[0]}님</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm ${app.status === 'NEW' ? 'bg-indigo-500' : app.status === 'CONTACTED' ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
                                                        {app.status === 'NEW' ? '미확인' : app.status === 'CONTACTED' ? '열람됨' : '거절됨'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1">
                                                        <Clock size={12} /> {new Date(app.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">지원 공고</p>
                                            <p className="text-[12px] font-black text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{app.job.title}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-5 mb-6 relative">
                                        <MessageSquare size={16} className="absolute -top-2 -left-2 text-amber-300 dark:text-pink-700" />
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
                                            "{app.resume_text || '메시지 없이 지원하셨습니다.'}"
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(app.id, 'CONTACTED')}
                                            className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-dark-bg hover:bg-black dark:hover:bg-white active:scale-[0.98] flex items-center justify-center gap-2 py-4 rounded-2xl text-[13px] font-black shadow-xl shadow-gray-100 dark:shadow-none transition"
                                        >
                                            <CheckCircle size={16} /> 연락완료 처리
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                            className="w-16 h-14 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition group"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {applications.length === 0 && (
                                <div className="py-24 text-center bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[40px] shadow-sm dark:shadow-none">
                                    <Search size={48} className="text-gray-100 dark:text-gray-800 mx-auto mb-4" />
                                    <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">아직 지원자가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
