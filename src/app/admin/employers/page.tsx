import React from 'react'
import prisma from '@/lib/prisma'
import EmployersTable from './EmployersTable'

export const dynamic = 'force-dynamic'

export default async function AdminEmployersPage() {
    const employers = await prisma.employer.findMany({
        orderBy: [
            { verification_status: 'asc' },
            { created_at: 'desc' }
        ],
        include: { user: true },
        take: 50
    })

    // Convert dates to string for client component serializability
    const serializedEmployers = employers.map(emp => ({
        ...emp,
        created_at: emp.created_at.toISOString(),
        updated_at: emp.updated_at.toISOString(),
        user: emp.user ? { ...emp.user, created_at: emp.user.created_at.toISOString(), updated_at: emp.user.updated_at.toISOString() } : null
    }));

    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border">
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">🏢 업소 승인 관리</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">업소회원들의 서류 및 정보를 확인하고 승인 여부를 결정합니다.</p>
            </header>

            <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
                <EmployersTable initialEmployers={serializedEmployers} />
            </section>
        </div>
    )
}
