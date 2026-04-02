const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    })
    console.log(JSON.stringify(admin))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
