import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET to check if a job is bookmarked
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const jobId = searchParams.get('jobId')

        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ isBookmarked: false })

        const existing = await prisma.bookmark.findUnique({
            where: {
                user_id_job_id: {
                    user_id: user.id,
                    job_id: jobId
                }
            }
        })

        return NextResponse.json({ isBookmarked: !!existing })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
