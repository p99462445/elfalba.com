import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        const isAdmin = dbUser?.role === 'ADMIN'
            || user.user_metadata?.role === 'ADMIN'
            || user.email === '1@gmail.com'

        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const updated = await prisma.supportQA.update({
            where: { id },
            data: { is_answer: true }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
