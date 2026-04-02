import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// 개인회원 → 업주 전환 API
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (!dbUser) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
        if (dbUser.role === 'EMPLOYER') {
            return NextResponse.json({ error: '이미 업소(기업) 회원입니다.' }, { status: 400 })
        }
        if (dbUser.role === 'ADMIN') {
            return NextResponse.json({ error: '관리자 계정은 전환할 수 없습니다.' }, { status: 400 })
        }

        const body = await req.json()
        const { business_name, business_number, address, owner_name, phone } = body

        if (!business_name) {
            return NextResponse.json({ error: '상호명은 필수입니다.' }, { status: 400 })
        }

        // 트랜잭션으로 role 변경 + employer 레코드 생성 (이미 있으면 기본 정보만 업데이트)
        const existingEmployer = await prisma.employer.findUnique({ where: { user_id: user.id } })

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { role: 'EMPLOYER' }
            }),
            existingEmployer
                ? prisma.employer.update({
                    where: { user_id: user.id },
                    data: {
                        business_name,
                        business_number: business_number || null,
                        address: address || null,
                        owner_name: owner_name || null,
                        phone: phone || null,
                    }
                })
                : prisma.employer.create({
                    data: {
                        user_id: user.id,
                        business_name,
                        business_number: business_number || null,
                        address: address || null,
                        owner_name: owner_name || null,
                        phone: phone || null,
                        verification_status: 'PENDING',
                    }
                })
        ])

        // Supabase metadata도 동기화
        try {
            const { createClient: createAdminClient } = await import('@supabase/supabase-js')
            const adminSupabase = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            await adminSupabase.auth.admin.updateUserById(user.id, {
                user_metadata: { role: 'EMPLOYER' }
            })
        } catch (err) {
            console.error('Supabase role sync failed:', err)
        }

        return NextResponse.json({ success: true, message: '업소(기업) 회원으로 전환되었습니다.' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
