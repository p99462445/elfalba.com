import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'No user in Supabase session' })

        const prismaUser = await prisma.user.findUnique({
            where: { id: user.id }
        })

        const employer = await prisma.employer.findUnique({
            where: { user_id: user.id }
        })

        return NextResponse.json({
            supabaseUser: {
                id: user.id,
                email: user.email
            },
            prismaUser: prismaUser ? {
                id: prismaUser.id,
                email: prismaUser.email,
                role: prismaUser.role
            } : 'Not found in Prisma',
            employer: employer ? {
                id: employer.id,
                businessName: employer.business_name
            } : 'Not found in Employer table'
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message })
    }
}
