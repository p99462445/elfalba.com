import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com'
}

export async function PATCH(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { id, name, price, jump_count, duration_days } = await req.json()

        const data: any = {}
        if (name !== undefined) data.name = name
        if (price !== undefined) data.price = Number(price)
        if (jump_count !== undefined) data.jump_count = jump_count ? Number(jump_count) : null
        if (duration_days !== undefined) data.duration_days = duration_days ? Number(duration_days) : null

        await prisma.product.update({
            where: { id },
            data
        })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
