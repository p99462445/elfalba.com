import prisma from './prisma'

async function testNotificationFlow() {
    const senderId = 'test-female-user-001' // 진이
    const recipientId = 'test-employer-user-001' // 김사장

    console.log('--- Chat Notification Test ---')

    // 1. Clear old chats and notifications for a clean test
    await prisma.message.deleteMany({ where: { room: { OR: [{ user1_id: senderId }, { user2_id: senderId }] } } })
    await prisma.notification.deleteMany({ where: { user_id: recipientId } })

    // Simulate sending message API
    const [u1, u2] = senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId]
    const room = await prisma.chatRoom.upsert({
        where: { user1_id_user2_id: { user1_id: u1, user2_id: u2 } },
        update: {},
        create: { user1_id: u1, user2_id: u2 }
    })

    const content = '안녕하세요, 테스트 알람입니다!'
    const message = await prisma.message.create({
        data: {
            room_id: room.id,
            sender_id: senderId,
            content
        }
    })

    // Simulated API logic
    await prisma.chatRoom.update({
        where: { id: room.id },
        data: {
            last_message: content,
            last_message_at: new Date()
        }
    })

    await prisma.notification.create({
        data: {
            user_id: recipientId,
            type: 'CHAT_MESSAGE',
            message: `상대방님이 메시지를 보냈습니다: ${content}`
        }
    })

    // 2. Check unread count for 김사장 (recipient)
    const count = await prisma.notification.count({
        where: { user_id: recipientId, is_read: false }
    })

    console.log(`- Created message: "${content}"`)
    console.log(`- Recipient (김사장) unread count: ${count}`)

    if (count === 1) {
        console.log('SUCCESS: Notification was correctly created and count updated.')
    } else {
        console.error('FAIL: Notification count mismatch.')
    }
}

testNotificationFlow().catch(console.error).finally(() => prisma.$disconnect())
