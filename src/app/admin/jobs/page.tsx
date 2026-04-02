import React from 'react'
import prisma from '@/lib/prisma'
import JobsTable from './JobsTable'

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage() {
    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">💼 채용공고 관리</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">등록된 전체 구인 공고를 모니터링하고 관리합니다.</p>
                </div>
            </header>

            <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
                <JobsTable initialJobs={[]} />
            </section>
        </div>
    )
}
