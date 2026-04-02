require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Testing Prisma Payment Creation with URL:', process.env.DATABASE_URL?.substring(0, 20) + '...')

        // Find a user and a product first
        const user = await prisma.user.findFirst()
        const product = await prisma.product.findFirst()

        if (!user || !product) {
            console.log('Need at least one user and one product to test.')
            return
        }

        console.log(`Using User: ${user.id}, Product: ${product.id}`)

        const payment = await prisma.payment.create({
            data: {
                user_id: user.id,
                product_id: product.id,
                amount: 1000,
                payment_method: 'BANK_TRANSFER',
                status: 'PENDING',
                depositor_name: 'Test Runner'
            }
        })

        console.log('Payment created successfully:', payment.id)

        // Clean up
        await prisma.payment.delete({ where: { id: payment.id } })
        console.log('Test payment deleted.')

    } catch (e) {
        console.error('Test failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
