import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                role: true,
                nickname: true,
                employer: {
                    select: { business_name: true }
                }
            }
        })

        return NextResponse.json({
            role: dbUser?.role || user.user_metadata?.role || 'USER',
            nickname: dbUser?.nickname || user.user_metadata?.nickname,
            businessName: dbUser?.employer?.business_name
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
