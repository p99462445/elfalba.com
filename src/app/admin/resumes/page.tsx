import React from 'react'
import AdminResumesClient from './AdminResumesClient'

export default function AdminResumesPage() {
    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border">
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">📄 이력서 관리</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">실시간으로 등록된 인재들의 이력서를 모니터링하고 공지사항을 관리합니다.</p>
            </header>

            <AdminResumesClient />
        </div>
    )
}
