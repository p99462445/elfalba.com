import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const employer = await prisma.employer.findUnique({
            where: { user_id: user.id }
        })

        if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

        const applications = await prisma.jobApplication.findMany({
            where: {
                job: {
                    employer_id: employer.id
                }
            },
            include: {
                user: true,
                job: true
            },
            orderBy: {
                created_at: 'desc'
            }
        })

        return NextResponse.json({ applications })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
