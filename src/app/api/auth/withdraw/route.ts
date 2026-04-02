import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
        }

        const originalEmail = user.email
        if (!originalEmail) throw new Error('Email not found')

        // 1. Prisma DB 데이터 보존하면서 탈퇴 처리 (Soft Delete + Email Rename)
        // 이메일을 변경해야 동일한 이메일로 나중에 재가입이 가능함
        const deletedEmail = `deleted_${Date.now()}_${originalEmail}`

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: deletedEmail,
                status: 'DELETED' as any,
                deleted_at: new Date()
            }
        })

        // 2. Supabase Auth에서 실제로 사용자 삭제 (그래야 동일 이메일 재가입 가능)
        // 주의: 이 작업은 Service Role Key가 필요함
        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

        if (deleteError) {
            console.error('Supabase Auth Delete Error:', deleteError)
            // Auth 삭제 실패해도 Prisma는 업데이트되었으므로 계속 진행하거나 에러 반환
            // 여기선 이미 DB 처리가 되었으므로 사용자에게 알리고 세션 만료 유도
        }

        return NextResponse.json({ success: true, message: '탈퇴 처리가 완료되었습니다.' })

    } catch (error: any) {
        console.error('Withdraw Logic Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
