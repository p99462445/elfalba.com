import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Get user from Prisma to see the role
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { employer: true }
        })

        if (!dbUser) {
            // If user exists in Supabase but not in Prisma, create it (Sync)
            const newUser = await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email!,
                    role: user.email === '1@gmail.com' ? 'ADMIN' : 'USER'
                }
            })
            return NextResponse.json({ user: newUser })
        }

        // Auto-promote specific email to ADMIN if needed
        if (dbUser.email === '1@gmail.com' && (dbUser.role !== 'ADMIN' || !dbUser.employer)) {
            const updatedUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                    role: 'ADMIN',
                    employer: dbUser.employer ? undefined : {
                        create: {
                            business_name: '관리자 테스트점',
                            business_number: '000-00-00000',
                            verification_status: 'APPROVED'
                        }
                    }
                },
                include: { employer: true }
            })

            // Sync to Supabase metadata so middleware picks it up
            await supabase.auth.updateUser({
                data: { role: 'ADMIN' }
            })

            return NextResponse.json({ user: updatedUser })
        }

        return NextResponse.json({ user: dbUser })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
