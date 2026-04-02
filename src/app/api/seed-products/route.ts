import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const products = [
            // 일반 (GENERAL_SLOT)
            { name: '일반 (30일)', price: 66000, duration_days: 30, jump_count: 300, product_type: 'GENERAL_SLOT' },
            { name: '일반 (60일)', price: 125000, duration_days: 60, jump_count: 600, product_type: 'GENERAL_SLOT' },
            { name: '일반 (90일)', price: 178000, duration_days: 90, jump_count: 900, product_type: 'GENERAL_SLOT' },
            { name: '일반 (120일)', price: 240000, duration_days: 120, jump_count: 1200, product_type: 'GENERAL_SLOT' },
            // 추천 (VIP_SLOT)
            { name: '추천 (30일)', price: 150000, duration_days: 30, jump_count: 800, product_type: 'VIP_SLOT' },
            { name: '추천 (60일)', price: 260000, duration_days: 60, jump_count: 1600, product_type: 'VIP_SLOT' },
            { name: '추천 (90일)', price: 380000, duration_days: 90, jump_count: 2400, product_type: 'VIP_SLOT' },
            { name: '추천 (120일)', price: 490000, duration_days: 120, jump_count: 3200, product_type: 'VIP_SLOT' },
            // 프리미엄 (VVIP_SLOT)
            { name: '프리미엄 (30일)', price: 330000, duration_days: 30, jump_count: 1300, product_type: 'VVIP_SLOT' },
            { name: '프리미엄 (60일)', price: 620000, duration_days: 60, jump_count: 2600, product_type: 'VVIP_SLOT' },
            { name: '프리미엄 (90일)', price: 890000, duration_days: 90, jump_count: 3900, product_type: 'VVIP_SLOT' },
            { name: '프리미엄 (120일)', price: 1100000, duration_days: 120, jump_count: 5200, product_type: 'VVIP_SLOT' },
        ]

        // Delete data in correct order
        // await prisma.payment.deleteMany({}) // 기존 결제 내역은 유지하는 게 좋을 수 있음
        await prisma.product.deleteMany({})

        await prisma.product.createMany({
            data: products as any
        })

        const allProducts = await prisma.product.findMany({ orderBy: [{ product_type: 'desc' }, { price: 'asc' }] })
        return NextResponse.json({ message: '상품 정보가 새로운 가격표로 업데이트되었습니다.', products: allProducts })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
