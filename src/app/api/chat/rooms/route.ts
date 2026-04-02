import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET /api/chat/rooms - List my rooms
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rooms = await prisma.chatRoom.findMany({
            where: {
                OR: [
                    { user1_id: user.id },
                    { user2_id: user.id }
                ]
            },
            include: {
                user1: { select: { id: true, nickname: true, email: true, role: true, employer: { select: { business_name: true, owner_name: true } } } },
                user2: { select: { id: true, nickname: true, email: true, role: true, employer: { select: { business_name: true, owner_name: true } } } },
                messages: {
                    take: 1,
                    orderBy: { created_at: 'desc' }
                }
            },
            orderBy: { updated_at: 'desc' }
        })

        // Mark notifications as read when visiting message box
        await prisma.notification.updateMany({
            where: {
                user_id: user.id,
                type: 'CHAT_MESSAGE',
                is_read: false
            },
            data: { is_read: true }
        })

        return NextResponse.json({ data: rooms })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/chat/rooms - Initiate/Get room
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { targetUserId } = await req.json()
        if (!targetUserId) return NextResponse.json({ error: 'Target ID required' }, { status: 400 })
        if (user.id === targetUserId) return NextResponse.json({ error: 'Self chat not allowed' }, { status: 400 })

        // Ensure user1_id < user2_id for unique constraint [user1_id, user2_id]
        const [u1, u2] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id]

        const room = await prisma.chatRoom.upsert({
            where: {
                user1_id_user2_id: {
                    user1_id: u1,
                    user2_id: u2
                }
            },
            update: {}, // Don't update anything if exists
            create: {
                user1_id: u1,
                user2_id: u2
            }
        })

        return NextResponse.json({ data: room })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
