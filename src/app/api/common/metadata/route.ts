import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const regions = await prisma.region.findMany({
            where: { parent_id: null },
            include: { children: true }
        })

        // Manual sorting for Seoul children
        const seoul = regions.find(r => r.name === '서울')
        if (seoul && seoul.children) {
            const priority = ['강남/서초', '송파/강동', '관악/구로/금천/동작', '강서/양천/영등포']
            seoul.children.sort((a, b) => {
                const indexA = priority.indexOf(a.name)
                const indexB = priority.indexOf(b.name)
                
                // If both are in priority list, follow the list order
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                // If only one is in priority list, it comes first
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                // Otherwise, maintain existing order (by name or original)
                return a.name.localeCompare(b.name, 'ko')
            })
        }

        const categories = await prisma.jobCategory.findMany({
            where: { parent_id: null },
            include: { children: true }
        })

        return NextResponse.json({ regions, categories })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
