import React from 'react'
import prisma from '@/lib/prisma'
import UsersTable from './UsersTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { created_at: 'desc' }
    })

    const serializedUsers = users.map(user => ({
        ...user,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
        deleted_at: user.deleted_at?.toISOString() || null,
        last_login: user.last_login?.toISOString() || null
    }));

    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border">
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">👥 회원 목록 및 제재 관리</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">전체 회원 정보를 확인하고 서비스 이용 권한을 관리합니다.</p>
            </header>

            <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
                <UsersTable initialUsers={serializedUsers} />
            </section>
        </div>
    )
}
