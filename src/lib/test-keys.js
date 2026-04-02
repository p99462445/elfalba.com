require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

const connectionString = process.env.DATABASE_URL

async function main() {
    try {
        console.log('Checking prisma object keys...')
        const pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }
        })
        const adapter = new PrismaPg(pool)
        const prisma = new PrismaClient({ adapter })

        const keys = Object.keys(prisma)
        console.log('Prisma keys starting with P/p:', keys.filter(k => k.toLowerCase().startsWith('p')))

        await prisma.$disconnect()
        await pool.end()
    } catch (e) {
        console.error('Keys test failed:', e)
    }
}

main()
