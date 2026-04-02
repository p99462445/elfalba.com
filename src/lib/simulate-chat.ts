import prisma from './prisma'

const USER1_ID = 'ce447324-7136-4132-87e8-d2cef511bcfe' // 1@gmail.com (ADMIN)
const USER2_EMAIL = 'user-test@example.com'

async function simulateChat() {
    try {
        console.log('--- Chat Simulation Start ---')

        // 1. Ensure User 2 exists
        let user2 = await prisma.user.findUnique({ where: { email: USER2_EMAIL } })
        if (!user2) {
            console.log('Creating User 2...')
            user2 = await prisma.user.create({
                data: {
                    id: 'test-user-uuid-1234',
                    email: USER2_EMAIL,
                    nickname: '테스트유저',
                    role: 'USER'
                }
            })
        }

        console.log(`Users: User1(Admin) and User2(${USER2_EMAIL})`)

        // 2. Initiate Room
        const [u1, u2] = USER1_ID < user2.id ? [USER1_ID, user2.id] : [user2.id, USER1_ID]
        const room = await prisma.chatRoom.upsert({
            where: { user1_id_user2_id: { user1_id: u1, user2_id: u2 } },
            update: {},
            create: { user1_id: u1, user2_id: u2 }
        })
        console.log('Room ID:', room.id)

        // 3. Send Messages
        const messages = [
            { sender_id: user2.id, content: '사장님, 안녕하세요! 공고 보고 연락드렸습니다.' },
            { sender_id: USER1_ID, content: '네, 반갑습니다. 언제부터 근무 가능하신가요?' },
            { sender_id: user2.id, content: '내일부터 바로 가능합니다!' }
        ]

        console.log('Sending messages...')
        for (const msg of messages) {
            await prisma.message.create({
                data: {
                    room_id: room.id,
                    sender_id: msg.sender_id,
                    content: msg.content
                }
            })
            // Update room meta
            await prisma.chatRoom.update({
                where: { id: room.id },
                data: { last_message: msg.content, last_message_at: new Date() }
            })
        }

        // 4. Verification
        console.log('--- Verification ---')
        const finalRoom = await prisma.chatRoom.findUnique({
            where: { id: room.id },
            include: { _count: { select: { messages: true } } }
        })
        console.log('Total messages in room:', finalRoom?._count.messages)
        console.log('Last message:', finalRoom?.last_message)

        console.log('Simulation Success!')

    } catch (error) {
        console.error('Simulation Failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

simulateChat()
