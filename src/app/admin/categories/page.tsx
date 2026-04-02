import React from 'react'
import prisma from '@/lib/prisma'
import CategoryManager from './CategoryManager'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
    const categories = await prisma.jobCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { jobs: true } } }
    })

    const regions = await prisma.region.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { jobs: true } } }
    })

    return (
        <div className="space-y-8">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border">
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">⚙️ 정보 분류 관리</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">직종(카테고리) 및 지역 정보를 관리합니다.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border p-6 overflow-hidden">
                    <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                        직종 카테고리 ({categories.length})
                    </h2>
                    <CategoryManager initialItems={categories} type="CATEGORY" />
                </section>

                <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border p-6 overflow-hidden">
                    <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        지역 분류 ({regions.length})
                    </h2>
                    <CategoryManager initialItems={regions} type="REGION" />
                </section>
            </div>
        </div>
    )
}
