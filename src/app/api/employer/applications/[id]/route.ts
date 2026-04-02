import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { status } = body

        // Verify that the application belongs to a job owned by this employer
        const application = await prisma.jobApplication.findUnique({
            where: { id },
            include: {
                job: true
            }
        })

        if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

        const employer = await prisma.employer.findUnique({
            where: { user_id: user.id }
        })

        if (!employer || application.job.employer_id !== employer.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updatedApplication = await prisma.jobApplication.update({
            where: { id },
            data: { status: status as any }
        })

        return NextResponse.json(updatedApplication)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
