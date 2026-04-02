require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

const connectionString = process.env.DATABASE_URL

async function main() {
    try {
        console.log('Testing Prisma Adapter Create...')
        const pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }
        })
        const adapter = new PrismaPg(pool)
        const prisma = new PrismaClient({ adapter })

        const user = await prisma.user.findFirst()
        const product = await prisma.product.findFirst()

        if (!user || !product) {
            console.log('User or product missing in DB.')
            return
        }

        console.log(`Creating payment for User ${user.id} and Product ${product.id}`)

        const payment = await prisma.payment.create({
            data: {
                user_id: user.id,
                product_id: product.id,
                amount: 1000,
                payment_method: 'BANK_TRANSFER',
                status: 'PENDING',
                depositor_name: 'Adapter Test'
            }
        })

        console.log('Payment created SUCCESS:', payment.id)

        await prisma.payment.delete({ where: { id: payment.id } })
        console.log('Test cleanup complete.')

        await prisma.$disconnect()
        await pool.end()
    } catch (e) {
        console.error('CRITICAL: Adapter CREATE failed:', e)
    }
}

main()
