import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    // 1. Fetch counts
    const totalUsers = await prisma.user.count()
    const totalEmployers = await prisma.employer.count()
    const pendingEmployers = await prisma.employer.count({
        where: { verification_status: 'PENDING' }
    })
    const totalActiveJobs = await prisma.job.count({
        where: { status: 'ACTIVE' }
    })
    const pendingJobs = await prisma.job.count({
        where: { status: 'PENDING' }
    })
    const recentPayments = await prisma.payment.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { user: true, product: true }
    })

    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow dark:shadow-none rounded-lg p-6 border dark:border-dark-border">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">관리자 대시보드 (통계 홈)</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">현재 사이트 등록 현황 및 주요 통계입니다.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-dark-card p-6 shadow dark:shadow-none rounded-lg border-l-4 border-blue-500 border dark:border-dark-border">
                    <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-1">전체 구직자 / 회원</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalUsers.toLocaleString()}명</p>
                </div>

                <div className="bg-white dark:bg-dark-card p-6 shadow dark:shadow-none rounded-lg border-l-4 border-purple-500 border dark:border-dark-border">
                    <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-1">전체 업소 회원</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalEmployers.toLocaleString()}곳</p>
                </div>

                <div className="bg-white dark:bg-dark-card p-6 shadow dark:shadow-none rounded-lg border-l-4 border-yellow-500 flex justify-between items-center border dark:border-dark-border">
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-1">업소 승인 대기</h3>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{pendingEmployers.toLocaleString()}건</p>
                    </div>
                    {pendingEmployers > 0 && (
                        <Link href="/admin/employers" className="text-sm font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30 py-1 px-3 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-900/30">
                            승인하러 가기 &rarr;
                        </Link>
                    )}
                </div>

                <div className="bg-white dark:bg-dark-card p-6 shadow dark:shadow-none rounded-lg border-l-4 border-green-500 border dark:border-dark-border">
                    <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-1">진행중인 채용공고</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalActiveJobs.toLocaleString()}건</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">승인 대기: {pendingJobs}건</p>
                </div>
            </div>

            {/* Recent Payments & Quick Links Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white dark:bg-dark-card shadow dark:shadow-none rounded-lg p-6 border dark:border-dark-border">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-dark-border pb-2">최근 결제 내역</h2>
                    {recentPayments.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-4">최근 결제 내역이 없습니다.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentPayments.map(payment => (
                                <div key={payment.id} className="flex justify-between items-center border-b dark:border-dark-border pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{payment.product?.name || '상품'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{payment.user?.email || '알 수 없는 유저'} · {payment.created_at.toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-amber-600">{payment.amount.toLocaleString()}원</p>
                                        <span className={`text-xs px-2 py-1 rounded font-semibold ${payment.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                                            payment.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' :
                                                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {payment.status === 'APPROVED' ? '결제완료' : payment.status === 'PENDING' ? '대기중' : payment.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-white dark:bg-dark-card shadow dark:shadow-none rounded-lg p-6 border dark:border-dark-border">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-dark-border pb-2">빠른 관리 메뉴</h2>
                    <ul className="grid grid-cols-2 gap-4">
                        <li>
                            <Link href="/admin/users" className="flex items-center p-3 border dark:border-dark-border rounded hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-gray-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card font-medium text-gray-700 dark:text-gray-300">
                                👥 회원 목록 및 제재 관리
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/employers" className="flex items-center p-3 border dark:border-dark-border rounded hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-gray-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card font-medium text-gray-700 dark:text-gray-300">
                                🏪 업소 승인 관리
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/jobs" className="flex items-center p-3 border dark:border-dark-border rounded hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-gray-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card font-medium text-gray-700 dark:text-gray-300">
                                💼 채용공고 관리
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/categories" className="flex items-center p-3 border dark:border-dark-border rounded hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-gray-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card font-medium text-gray-700 dark:text-gray-300">
                                ⚙️ 정보 분류 (테마/직종)
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/settings" className="flex items-center p-3 border dark:border-dark-border rounded hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-gray-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-card font-medium text-gray-700 dark:text-gray-300">
                                🛠️ 환경 설정 (사이트 정보/알림)
                            </Link>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
