import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { businessName, nickname } = await req.json()

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { employer: true }
        })

        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (nickname) {
            await prisma.user.update({
                where: { id: user.id },
                data: { nickname }
            })
            // Also update Supabase metadata for consistency
            await supabase.auth.updateUser({
                data: { nickname }
            })
        }

        return NextResponse.json({ message: 'Profile updated successfully' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
