import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting all jobs from DB...')
    // deleteMany returns { count: number }
    const res = await prisma.job.deleteMany({})
    console.log(`Successfully deleted ${res.count} jobs.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
