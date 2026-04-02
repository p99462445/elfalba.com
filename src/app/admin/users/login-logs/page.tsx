export const dynamic = 'force-dynamic';
import React from 'react'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'


export default async function LoginLogsPage(props: { searchParams: Promise<{ q?: string, page?: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || (user.user_metadata?.role !== 'ADMIN' && user.email !== '1@gmail.com')) {
        redirect('/')
    }

    const { q, page } = await props.searchParams
    const qString = q || ''
    const currentPage = parseInt(page || '1') || 1
    const limit = 20
    const skip = (currentPage - 1) * limit

    const where: any = {}
    if (qString) {
        where.user = {
            OR: [
                { email: { contains: qString, mode: 'insensitive' } },
                { nickname: { contains: qString, mode: 'insensitive' } }
            ]
        }
    }

    const [logs, total] = await Promise.all([
        prisma.loginLog.findMany({
            where,
            include: { user: true },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit
        }),
        prisma.loginLog.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    // Helper to determine device from user-agent
    const getDeviceType = (ua: string | null) => {
        if (!ua) return { device: '알 수 없음', type: 'Unknown' }
        const lower = ua.toLowerCase()
        if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
            return { device: '스마트기기', type: 'Mobile Web' }
        }
        return { device: '데스크톱PC', type: 'PC Web' }
    }

    return (
        <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-purple-600">회원 로그인 로그</h1>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-bold text-gray-500 cursor-help" title="회원들의 최근 로그인 접속 기록입니다.">?</span>
            </div>

            {/* Basic Filter UI */}
            <div className="flex border border-gray-300 dark:border-dark-border rounded select-none mb-8">
                <div className="flex-1 flex flex-col">
                    <div className="flex border-b border-gray-200 dark:border-dark-border text-[13px]">
                        <div className="w-40 bg-gray-50 dark:bg-dark-bg p-3 flex items-center font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-dark-border">
                            검색어
                        </div>
                        <div className="p-3 flex items-center gap-2">
                            <form className="flex items-center gap-2" method="GET">
                                <select className="border border-gray-300 dark:border-dark-border rounded px-3 py-1.5 bg-white dark:bg-dark-card">
                                    <option value="email">회원 이메일/닉네임</option>
                                </select>
                                <input
                                    type="text"
                                    name="q"
                                    defaultValue={qString}
                                    className="border border-gray-300 dark:border-dark-border rounded px-3 py-1.5 w-64 bg-white dark:bg-dark-card outline-none focus:border-amber-500"
                                />
                                <button type="submit" className="bg-gray-800 text-white px-4 py-1.5 rounded font-bold hover:bg-black transition">검색</button>
                                {qString && <a href="/admin/users/login-logs" className="text-gray-500 font-bold ml-2 hover:underline">초기화</a>}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-xs font-bold text-gray-500 mb-2">총 {total.toLocaleString()}건의 로그인 기록</div>

            {/* Table Area */}
            <div className="overflow-x-auto border border-gray-300 dark:border-dark-border rounded">
                <table className="w-full text-center text-[13px] border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-[#D9E1ED] text-[#2D4F88] font-black border-b border-gray-300 dark:border-dark-border text-xs h-10">
                            <th className="border-r border-gray-300 dark:border-dark-border w-16">No</th>
                            <th className="border-r border-gray-300 dark:border-dark-border w-24">디바이스</th>
                            <th className="border-r border-gray-300 dark:border-dark-border w-24">접속유형</th>
                            <th className="border-r border-gray-300 dark:border-dark-border px-4">회원 계정</th>
                            <th className="border-r border-gray-300 dark:border-dark-border w-24">닉네임</th>
                            <th className="border-r border-gray-300 dark:border-dark-border w-24">등급</th>
                            <th className="border-r border-gray-300 dark:border-dark-border w-32">IP</th>
                            <th className="w-40">로그인 시간</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300">
                        {logs.map((log, index) => {
                            const { device, type } = getDeviceType(log.user_agent)
                            return (
                                <tr key={log.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg h-10 text-xs">
                                    <td className="border-r border-gray-200 dark:border-dark-border text-gray-400">
                                        {total - skip - index}
                                    </td>

                                    <td className="border-r border-gray-200 dark:border-dark-border font-bold text-blue-600 dark:text-blue-400">
                                        {device}
                                    </td>
                                    <td className="border-r border-gray-200 dark:border-dark-border text-amber-500">
                                        {type}
                                    </td>

                                    <td className="border-r border-gray-200 dark:border-dark-border font-semibold text-gray-800 dark:text-gray-200 text-left px-4 truncate max-w-[200px]">
                                        {log.user?.email || '[탈퇴 회원]'}
                                    </td>

                                    <td className="border-r border-gray-200 dark:border-dark-border">
                                        {log.user?.nickname || '-'}
                                    </td>
                                    <td className="border-r border-gray-200 dark:border-dark-border">
                                        {log.user?.role === 'EMPLOYER' ? (
                                            <span className="text-blue-500 font-bold">업소회원</span>
                                        ) : log.user?.role === 'ADMIN' ? (
                                            <span className="text-purple-500 font-bold">관리자</span>
                                        ) : (
                                            <span className="text-gray-500">일반회원</span>
                                        )}
                                    </td>

                                    <td className="border-r border-gray-200 dark:border-dark-border text-gray-500 font-mono tracking-tighter">
                                        {log.ip || 'Unknown'}
                                    </td>
                                    <td className="text-gray-500 font-mono text-[11px]">
                                        {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                    </td>
                                </tr>
                            )
                        })}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-20 text-center text-gray-400">조회된 로그인 기록이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <a
                            key={pageNum}
                            href={`/admin/users/login-logs?page=${pageNum}${qString ? `&q=${qString}` : ''}`}
                            className={`w-8 h-8 flex items-center justify-center font-bold text-sm border ${pageNum === currentPage ? 'bg-[#2D4F88] text-white border-[#2D4F88]' : 'bg-white text-gray-600 hover:bg-gray-50'} transition`}
                        >
                            {pageNum}
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}
