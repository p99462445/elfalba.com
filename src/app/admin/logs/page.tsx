'use client'
import React, { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, X, Clock, User, Hash, Info } from 'lucide-react'
import Link from 'next/link'

interface Log {
    id: string
    job_id: string
    created_at: string
    changed_fields: string[]
    before_data: any
    after_data: any
    ip_address: string
    job: { job_no: number, title: string, business_name: string }
    user: { email: string, name: string | null } | null
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<Log[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [jobNo, setJobNo] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedLog, setSelectedLog] = useState<Log | null>(null)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const url = new URL('/api/admin/logs', window.location.origin)
            url.searchParams.set('page', String(page))
            url.searchParams.set('limit', String(limit))
            if (jobNo) url.searchParams.set('jobNo', jobNo)

            const res = await fetch(url.toString())
            const data = await res.json()
            if (res.ok) {
                setLogs(data.logs)
                setTotal(data.total)
            }
        } catch (error) { console.error(error) }
        finally { setIsLoading(false) }
    }

    useEffect(() => {
        fetchLogs()
    }, [page, limit])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        fetchLogs()
    }

    const fieldLabels: Record<string, string> = {
        title: '공고제목',
        business_name: '상호명',
        description: '공고내용',
        salary_type: '급여방식',
        salary_amount: '급여금액',
        salary_info: '급여상세',
        age_min: '최소나이',
        age_max: '최대나이',
        gender: '성별',
        contact_info: '연락처',
        manager_name: '담당자',
        status: '상태',
        exposure_level: '등급'
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans bg-[#fcfdff] dark:bg-dark-bg min-h-screen transition-colors duration-300">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">📜 공고 수정로그</h1>
                    <p className="text-gray-400 font-bold mt-1 text-sm uppercase tracking-widest">Job Modification History Oversight</p>
                </div>
                
                <form onSubmit={handleSearch} className="flex gap-2 bg-white dark:bg-dark-card p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                            placeholder="공고번호(Job NO) 입력..." 
                            value={jobNo}
                            onChange={e => setJobNo(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition w-[240px]" 
                        />
                    </div>
                    <button type="submit" className="px-6 bg-gray-900 text-white font-black rounded-xl hover:bg-amber-500 transition shadow-lg shadow-gray-200">검색</button>
                </form>
            </header>

            <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-100 dark:border-dark-border shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-dark-bg/50 border-b border-gray-100 dark:border-dark-border text-gray-400">
                            <th className="p-5 font-black text-[11px] uppercase tracking-tighter w-24">공고번호</th>
                            <th className="p-5 font-black text-[11px] uppercase tracking-tighter w-48">일시</th>
                            <th className="p-5 font-black text-[11px] uppercase tracking-tighter w-48">수정자</th>
                            <th className="p-5 font-black text-[11px] uppercase tracking-tighter">변경 항목</th>
                            <th className="p-5 font-black text-[11px] uppercase tracking-tighter w-32 text-center">동작</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-black animate-pulse">데이터를 불러오는 중...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-black">기록된 로그가 없습니다.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-pink-900/10 transition-colors group">
                                <td className="p-5 font-black text-gray-400 dark:text-gray-500">#{log.job?.job_no}</td>
                                <td className="p-5">
                                    <div className="flex flex-col leading-tight">
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{new Date(log.created_at).toLocaleDateString()}</span>
                                        <span className="text-[11px] font-black text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-pink-900/30 flex items-center justify-center text-amber-500">
                                            <User size={14} strokeWidth={3} />
                                        </div>
                                        <div className="flex flex-col min-w-0 leading-tight">
                                            <span className="font-black text-gray-800 dark:text-gray-100 truncate">{log.user?.name || '업주'}</span>
                                            <span className="text-[11px] font-bold text-gray-400 truncate">{log.user?.email || '-'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-wrap gap-1.5">
                                        {log.changed_fields.map(field => (
                                            <span key={field} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                {fieldLabels[field] || field}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-5 text-center">
                                    <button 
                                        onClick={() => setSelectedLog(log)}
                                        className="px-4 py-2 bg-gray-50 dark:bg-dark-bg text-gray-500 font-black rounded-xl text-[11px] hover:bg-gray-900 dark:hover:bg-amber-500 hover:text-white transition active:scale-95"
                                    >수정대조</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-3 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm text-gray-400 hover:text-amber-500 disabled:opacity-30 disabled:hover:text-gray-400 transition"
                ><ChevronLeft size={20} /></button>
                <div className="px-6 py-3 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl shadow-sm text-sm font-black text-gray-500 dark:text-gray-400">
                    PAGE <span className="text-amber-500 ml-1">{page}</span> / {Math.ceil(total/limit)}
                </div>
                <button 
                    disabled={page >= Math.ceil(total/limit)}
                    onClick={() => setPage(page + 1)}
                    className="p-3 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm text-gray-400 hover:text-amber-500 disabled:opacity-30 disabled:hover:text-gray-400 transition"
                ><ChevronRight size={20} /></button>
            </div>

            {/* Comparison Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white dark:bg-dark-card rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <header className="p-8 border-b border-gray-50 dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-bg/50">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-gray-900 dark:bg-amber-600 text-white rounded-2xl shadow-xl">
                                    <Clock size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">공고 수정 전후 대조</h2>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-[12px] font-black text-amber-500 tracking-widest uppercase">#{selectedLog.job.job_no} {selectedLog.job.business_name}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-dark-border inline-block"></span>
                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500">{new Date(selectedLog.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-3 bg-white dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl text-gray-400 hover:text-amber-500 transition shadow-sm"><X size={24} /></button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 bg-[#fcfdff] dark:bg-dark-bg">
                            <div className="grid grid-cols-2 gap-8 sticky top-0 bg-[#fcfdff] dark:bg-dark-bg pb-6 z-10">
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-black text-center text-sm shadow-sm">🛑 수정 전 (BEFORE)</div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-center text-sm shadow-sm">✅ 수정 후 (AFTER)</div>
                            </div>

                            <div className="space-y-6">
                                {selectedLog.changed_fields.map(field => {
                                    const bf = selectedLog.before_data[field]
                                    const af = selectedLog.after_data[field]
                                    const isRichText = field === 'description'

                                    return (
                                        <div key={field} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                                                <span className="font-black text-gray-900 dark:text-gray-100 text-sm">{fieldLabels[field] || field}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8 h-full">
                                                <div className="bg-white dark:bg-dark-card border-2 border-dashed border-rose-100 dark:border-rose-900/30 rounded-2xl p-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed shadow-sm min-h-[100px] overflow-auto">
                                                    {field === 'vvip_expired_at' || field === 'vip_expired_at' || field === 'normal_expired_at' 
                                                        ? (bf ? new Date(bf).toLocaleDateString() : '날짜 없음')
                                                        : (isRichText ? (
                                                            <div className="opacity-60 dark:opacity-40 grayscale scale-[0.98] pointer-events-none" dangerouslySetInnerHTML={{ __html: bf }}></div>
                                                        ) : String(bf || '-'))
                                                    }
                                                </div>
                                                <div className="bg-white dark:bg-dark-card border-2 border-indigo-50 dark:border-indigo-900/30 rounded-2xl p-6 text-sm text-indigo-900 dark:text-indigo-200 font-bold leading-relaxed shadow-md min-h-[100px] overflow-auto ring-4 ring-indigo-50/20 dark:ring-indigo-900/10">
                                                    {field === 'vvip_expired_at' || field === 'vip_expired_at' || field === 'normal_expired_at' 
                                                        ? (af ? new Date(af).toLocaleDateString() : '날짜 없음')
                                                        : (isRichText ? (
                                                            <div dangerouslySetInnerHTML={{ __html: af }}></div>
                                                        ) : String(af || '-'))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <footer className="p-8 border-t border-gray-50 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-card">
                            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                <Info size={14} />
                                <span>IP Address: {selectedLog.ip_address}</span>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="px-10 py-4 bg-gray-900 dark:bg-amber-600 text-white font-black rounded-2xl shadow-xl hover:bg-amber-500 dark:hover:bg-amber-500 transition shadow-gray-200 dark:shadow-none">기록 확인 완료</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    )
}
