import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com'
}

export async function POST(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { name, slug, type } = await req.json()
        let item;
        if (type === 'CATEGORY') {
            item = await prisma.jobCategory.create({
                data: { name, slug }
            })
        } else {
            item = await prisma.region.create({
                data: { name, slug }
            })
        }
        return NextResponse.json({ success: true, item })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { searchParams } = new URL(req.url)
        const id = parseInt(searchParams.get('id') || '0')
        const type = searchParams.get('type')

        if (type === 'CATEGORY') {
            await prisma.jobCategory.delete({ where: { id } })
        } else {
            await prisma.region.delete({ where: { id } })
        }
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: '기존 공고와 연동된 정보는 삭제할 수 없습니다. (먼저 관련 공고를 삭제하세요)' }, { status: 500 })
    }
}
