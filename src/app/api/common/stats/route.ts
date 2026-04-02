import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const [userCount, jobCount] = await Promise.all([
            prisma.user.count(),
            prisma.job.count({ where: { status: 'ACTIVE' } })
        ])

        return NextResponse.json({
            userCount,
            jobCount
        })
    } catch (error: any) {
        return NextResponse.json({ userCount: 0, jobCount: 0 })
    }
}
