import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET: 특정 QA의 댓글 목록
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 작성자 또는 관리자만 조회 가능
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        const isAdmin = dbUser?.role === 'ADMIN' || user.user_metadata?.role === 'ADMIN' || user.email === '1@gmail.com'

        const qa = await prisma.supportQA.findUnique({ where: { id } })
        if (!qa) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!isAdmin && qa.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const comments = await prisma.supportQAComment.findMany({
            where: { qa_id: id },
            orderBy: { created_at: 'asc' },
            include: { user: { select: { name: true, nickname: true, role: true } } }
        })

        return NextResponse.json(comments)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: 댓글 작성 (작성자 or 관리자)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        const isAdmin = dbUser?.role === 'ADMIN' || user.user_metadata?.role === 'ADMIN' || user.email === '1@gmail.com'

        // 작성자 또는 관리자만 댓글 작성 가능
        const qa = await prisma.supportQA.findUnique({ where: { id } })
        if (!qa) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!isAdmin && qa.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { content } = await req.json()
        if (!content?.trim()) return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })

        const comment = await prisma.supportQAComment.create({
            data: {
                qa_id: id,
                user_id: user.id,
                content,
                is_admin: isAdmin
            },
            include: { user: { select: { name: true, nickname: true, role: true } } }
        })

        // 관리자가 댓글 달면 → 자동으로 답변완료 처리
        if (isAdmin && !qa.is_answer) {
            await prisma.supportQA.update({ where: { id }, data: { is_answer: true } })
        }

        return NextResponse.json(comment, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
