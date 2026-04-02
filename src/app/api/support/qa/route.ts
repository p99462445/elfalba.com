import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET: 관리자 → 전체, 일반 유저 → 본인 글만
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        const isAdmin = dbUser?.role === 'ADMIN'
            || user.user_metadata?.role === 'ADMIN'
            || user.email === '1@gmail.com'

        const qas = await prisma.supportQA.findMany({
            where: isAdmin ? undefined : { user_id: user.id },
            orderBy: { created_at: 'desc' },
            include: { user: { select: { name: true, nickname: true, role: true } } }
        })

        return NextResponse.json(qas)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: 모든 로그인 유저가 작성 가능
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { title, content } = await req.json()
        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
        }

        const qa = await prisma.supportQA.create({
            data: { user_id: user.id, title, content }
        })
        return NextResponse.json(qa, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
