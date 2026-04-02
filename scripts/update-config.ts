import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
})
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
    const updated = await prisma.siteConfig.upsert({
        where: { id: 'default' },
        update: {
            contact_phone: '1899-0930',
            bank_name: '국민은행',
            bank_account: '219401-04-263185',
            bank_owner: '(주)세컨즈나인',
        },
        create: {
            id: 'default',
            contact_phone: '1899-0930',
            bank_name: '국민은행',
            bank_account: '219401-04-263185',
            bank_owner: '(주)세컨즈나인',
        },
    })
    console.log('Site config updated:', updated)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
