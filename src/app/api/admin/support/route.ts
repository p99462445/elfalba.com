import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com'
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // NOTICE or FAQ

    try {
        if (type === 'NOTICE') {
            const notices = await prisma.notice.findMany({ orderBy: { created_at: 'desc' } })
            return NextResponse.json(notices)
        } else {
            const faqs = await prisma.fAQ.findMany({ orderBy: { order: 'asc' } })
            return NextResponse.json(faqs)
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const body = await req.json()
        const { type, ...data } = body

        if (type === 'NOTICE') {
            const notice = await prisma.notice.create({
                data: {
                    title: data.title,
                    content: data.content,
                    is_important: data.is_important || false
                }
            })
            return NextResponse.json(notice)
        } else {
            const faq = await prisma.fAQ.create({
                data: {
                    question: data.question,
                    answer: data.answer,
                    category: data.category,
                    order: data.order || 0
                }
            })
            return NextResponse.json(faq)
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const body = await req.json()
        const { id, type, ...data } = body

        if (type === 'NOTICE') {
            const notice = await prisma.notice.update({
                where: { id },
                data: {
                    title: data.title,
                    content: data.content,
                    is_important: data.is_important
                }
            })
            return NextResponse.json(notice)
        } else {
            const faq = await prisma.fAQ.update({
                where: { id },
                data: {
                    question: data.question,
                    answer: data.answer,
                    category: data.category,
                    order: data.order
                }
            })
            return NextResponse.json(faq)
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const type = searchParams.get('type')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        if (type === 'NOTICE') {
            await prisma.notice.delete({ where: { id } })
        } else {
            await prisma.fAQ.delete({ where: { id } })
        }
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
