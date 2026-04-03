import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const categories = [
        { name: '촬영보조', slug: 'camera-assistant' },
        { name: '연기자', slug: 'actor' },
        { name: '보조출연', slug: 'extra' },
        { name: '기타', slug: 'etc' },
    ]

    for (const cat of categories) {
        await prisma.jobCategory.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name },
            create: { name: cat.name, slug: cat.slug }
        })
        console.log(`Upserted category: ${cat.name} (${cat.slug})`)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
