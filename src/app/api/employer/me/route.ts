import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const employer = await prisma.employer.findUnique({
            where: { user_id: user.id }
        })

        console.log("FETCHING EMPLOYER FOR:", user.id, employer ? "FOUND" : "NOT FOUND")

        if (!employer) {
            return NextResponse.json({ error: 'Employer record not found' }, { status: 404 })
        }

        const jobs = await prisma.job.findMany({
            where: { employer_id: employer.id },
            include: {
                region: true,
                category: true,
                images: true,
                payments: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            },
            orderBy: { last_jumped_at: 'desc' }
        })

        const siteConfig = await prisma.siteConfig.findUnique({
            where: { id: 'default' }
        })

        const unlinkedPayments = await prisma.payment.findMany({
            where: {
                user_id: user.id,
                status: 'APPROVED',
                job_id: null
            },
            include: { product: true },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json({ employer, jobs, siteConfig, unlinkedPayments })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
