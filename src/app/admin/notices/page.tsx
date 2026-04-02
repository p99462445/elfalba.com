import React from 'react'
import prisma from '@/lib/prisma'
import SupportManager from './SupportManager'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
    const notices = await prisma.notice.findMany({
        orderBy: { created_at: 'desc' }
    })

    const faqs = await prisma.fAQ.findMany({
        orderBy: { order: 'asc' }
    })

    const serializedNotices = notices.map(n => ({
        ...n,
        created_at: n.created_at.toISOString(),
        updated_at: n.updated_at.toISOString()
    }))

    const serializedFaqs = faqs.map(f => ({
        ...f,
        created_at: f.created_at.toISOString(),
        updated_at: f.updated_at.toISOString()
    }))

    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">📢 공지·FAQ 관리</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">고객센터 페이지에 표시될 공지사항과 자주 묻는 질문을 관리합니다.</p>
                </div>
            </header>

            <SupportManager initialNotices={serializedNotices} initialFaqs={serializedFaqs} />
        </div>
    )
}
