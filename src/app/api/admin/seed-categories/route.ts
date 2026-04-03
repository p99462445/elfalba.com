import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const categories = [
            { name: '촬영보조', slug: 'camera-assistant' },
            { name: '연기자', slug: 'actor' },
            { name: '보조출연', slug: 'extra' },
            { name: '기타', slug: 'etc' },
        ]

        const results = [];
        for (const cat of categories) {
            const result = await prisma.jobCategory.upsert({
                where: { slug: cat.slug },
                update: { name: cat.name },
                create: { name: cat.name, slug: cat.slug }
            })
            results.push(result);
        }

        return NextResponse.json({ success: true, count: results.length, data: results })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
