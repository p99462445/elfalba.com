import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET all bookmarks for the current user
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const bookmarks = await prisma.bookmark.findMany({
            where: { user_id: user.id },
            include: {
                job: {
                    include: {
                        employer: { select: { business_name: true } },
                        region: { select: { name: true } },
                        category: { select: { name: true } },
                        images: { take: 1, select: { image_url: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json({ data: bookmarks })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST toggles a bookmark (add or remove)
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { jobId } = await req.json()
        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

        const existing = await prisma.bookmark.findUnique({
            where: {
                user_id_job_id: {
                    user_id: user.id,
                    job_id: jobId
                }
            }
        })

        if (existing) {
            // Remove bookmark
            await prisma.bookmark.delete({
                where: {
                    user_id_job_id: {
                        user_id: user.id,
                        job_id: jobId
                    }
                }
            })
            return NextResponse.json({ message: 'Bookmark removed', isBookmarked: false })
        } else {
            // Add bookmark
            await prisma.bookmark.create({
                data: {
                    user_id: user.id,
                    job_id: jobId
                }
            })
            return NextResponse.json({ message: 'Bookmarked', isBookmarked: true })
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
