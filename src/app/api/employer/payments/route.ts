import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payments = await prisma.payment.findMany({
            where: { user_id: user.id },
            include: {
                product: true,
                job: true
            },
            orderBy: { created_at: 'desc' }
        })


        return NextResponse.json(payments)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
