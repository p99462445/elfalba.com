import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET /api/chat/rooms/[id]/messages - Get history
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if user is part of the room
        const room = await prisma.chatRoom.findUnique({
            where: { id }
        })

        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        if (room.user1_id !== user.id && room.user2_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const messages = await prisma.message.findMany({
            where: { room_id: id },
            orderBy: { created_at: 'asc' },
            include: { sender: { select: { id: true, nickname: true, role: true, employer: { select: { business_name: true, owner_name: true } } } } }
        })

        // Mark as read (optional logic: mark all from other user as read)
        await prisma.message.updateMany({
            where: {
                room_id: id,
                sender_id: { not: user.id },
                is_read: false
            },
            data: { is_read: true }
        })

        return NextResponse.json({ data: messages })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/chat/rooms/[id]/messages - Send message
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { content } = await req.json()
        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

        const room = await prisma.chatRoom.findUnique({ where: { id } })
        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        if (room.user1_id !== user.id && room.user2_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const message = await prisma.message.create({
            data: {
                room_id: id,
                sender_id: user.id,
                content
            }
        })

        // Update room's last message
        const updatedRoom = await prisma.chatRoom.update({
            where: { id },
            data: {
                last_message: content,
                last_message_at: new Date()
            }
        })

        // Create notification for recipient
        const recipientId = updatedRoom.user1_id === user.id ? updatedRoom.user2_id : updatedRoom.user1_id
        await prisma.notification.create({
            data: {
                user_id: recipientId,
                type: 'CHAT_MESSAGE',
                message: `${user.user_metadata?.nickname || '상대방'}님이 메시지를 보냈습니다: ${content.slice(0, 20)}${content.length > 20 ? '...' : ''}`
            }
        })

        return NextResponse.json({ data: message })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
