import React from 'react'
import JobsTable from '../jobs/JobsTable'

export const dynamic = 'force-dynamic'

export default async function ExposureManagementPage() {
    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">🔎 노출 공고 관리</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">현재 사이트에 노출되고 있는 유료/전체 공고들의 마감일을 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-black">실시간 노출 중</span>
                </div>
            </header>

            <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
                <JobsTable initialJobs={[]} mode="exposure" />
            </section>
        </div>
    )
}
