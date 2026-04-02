import React from 'react'
import prisma from '@/lib/prisma'
import PaymentsTable from './PaymentsTable'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
    const payments = await prisma.payment.findMany({
        orderBy: { created_at: 'desc' },
        include: {
            user: {
                include: { employer: true }
            },
            product: true,
            job: {
                include: { employer: true }
            }
        }
    })


    // Serialize dates for client component
    const serializedPayments = payments.map(p => ({
        ...p,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
    }))

    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl p-8 border border-gray-100 dark:border-dark-border flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">💰 결제·정산 관리</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">업소회원의 유료 상품 결제 내역을 확인하고 승인 처리합니다.</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-2xl font-black text-amber-500">
                        {payments
                            .filter(p => p.status === 'APPROVED')
                            .reduce((acc, curr) => acc + curr.amount, 0)
                            .toLocaleString()}원
                    </p>
                </div>
            </header>

            <section className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
                <PaymentsTable initialPayments={serializedPayments} />
            </section>
        </div>
    )
}
