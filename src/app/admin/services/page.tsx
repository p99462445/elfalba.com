import React from 'react'
import prisma from '@/lib/prisma'
import ProductManager from './ProductManager'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
    const products = await prisma.product.findMany({
        orderBy: { price: 'desc' }
    })

    return (
        <div className="space-y-6">
            <header className="bg-white shadow-soft rounded-2xl p-8 border border-gray-100">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">💎 서비스 금액 및 상품 관리</h1>
                        <p className="text-gray-500 mt-2 text-sm font-medium">유료 광고 상품의 이름, 가격, 점프 횟수, 기간을 수정합니다.</p>
                    </div>
                    <a
                        href="/api/seed-products"
                        target="_blank"
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-gray-700 transition whitespace-nowrap"
                    >
                        🔄 상품 초기화
                    </a>
                </div>
            </header>

            <section className="bg-white shadow-soft rounded-2xl border border-gray-100 p-6">
                <ProductManager initialProducts={products} />
            </section>
        </div>
    )
}
