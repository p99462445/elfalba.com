import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendAutomationMessage } from '@/lib/chat/automation'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        // 1. Find Admin
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            orderBy: { created_at: 'asc' } // Get the first admin
        })

        if (!admin) {
            return NextResponse.json({ error: '관리자를 찾을 수 없습니다.' }, { status: 404 })
        }

        // 2. Find or Create Room (Using sorted IDs for consistency)
        const [u1, u2] = [user.id, admin.id].sort()

        let room = await prisma.chatRoom.findUnique({
            where: {
                user1_id_user2_id: {
                    user1_id: u1,
                    user2_id: u2
                }
            }
        })

        if (!room) {
            room = await prisma.chatRoom.create({
                data: {
                    user1_id: u1,
                    user2_id: u2
                }
            })
        }

        // 3. Send QNA Welcome Message
        await sendAutomationMessage(user.id, 'QNA_WELCOME' as any)

        return NextResponse.json({ roomId: room.id })
    } catch (error) {
        console.error('QnA Chat Error:', error)
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
