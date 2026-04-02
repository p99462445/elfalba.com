import prisma from './prisma'

async function main() {
    try {
        const users = await prisma.user.findMany({
            take: 10,
            select: { id: true, email: true, nickname: true }
        })
        console.log(JSON.stringify(users, null, 2))
    } catch (e) {
        console.error(e)
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
