import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { role, verificationToken } = await request.json()
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
        }

        let verifiedData: any = null
        if (verificationToken) {
            const tokenRecord = await prisma.verificationToken.findUnique({
                where: { token: verificationToken }
            })

            if (tokenRecord && new Date() < new Date(tokenRecord.expires_at)) {
                verifiedData = tokenRecord.data as any
                // Delete token after use
                await prisma.verificationToken.delete({ where: { token: verificationToken } })
            }
        }

        if (!['USER', 'EMPLOYER'].includes(role)) {
            return NextResponse.json({ error: '잘못된 역할입니다.' }, { status: 400 })
        }

        // Update the user in Prisma Database with both Role and Verified Info
        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                role,
                ...(verifiedData && {
                    real_name: verifiedData.name,
                    birthdate: verifiedData.birthDate,
                    gender: verifiedData.gender,
                    ci: verifiedData.ci,
                    phone: verifiedData.phone,
                    is_adult: true,
                    verified_at: new Date(),
                })
            },
            create: {
                id: user.id,
                email: user.email ?? '',
                role: role,
                name: verifiedData?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
                nickname: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
                ...(verifiedData && {
                    real_name: verifiedData.name,
                    birthdate: verifiedData.birthDate,
                    gender: verifiedData.gender,
                    ci: verifiedData.ci,
                    phone: verifiedData.phone,
                    is_adult: true,
                    verified_at: new Date(),
                })
            }
        })

        // Sync with Supabase Auth Metadata for Middleware visibility
        await supabase.auth.updateUser({
            data: {
                is_adult: verifiedData ? true : false,
                role: role,
                full_name: verifiedData?.name || user.user_metadata?.full_name
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Role update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
