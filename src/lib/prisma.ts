import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const singletonPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL || ''
    const cleanConnectionString = connectionString.trim().replace(/[\r\n]/g, '')

    const pool = new Pool({
        connectionString: cleanConnectionString,
        ssl: { rejectUnauthorized: false },
        max: 3, // 서버리스 환경에서는 낮은 숫자가 더 안정적입니다.
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    })

    pool.on('error', (err) => {
        console.error('[Prisma Pool Error]', err)
    })

    const adapter = new PrismaPg(pool as any)
    return new PrismaClient({ adapter })
}

declare global {
    var prisma: undefined | ReturnType<typeof singletonPrismaClient>
}

// Ensure the singleton picks up new models (like Resume) during development
if (process.env.NODE_ENV !== 'production' && globalThis.prisma && !(globalThis.prisma as any).resume) {
    globalThis.prisma = undefined
}

const prisma = globalThis.prisma ?? singletonPrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma 
// Forced refresh to pick up new models (Resume, etc.)
