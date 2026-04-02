import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const singletonPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || ''
    
    if (!connectionString) {
        console.warn('DATABASE_URL is missing. Running in Prisma Mock Mode (Shell Site)');
        
        const deepMockHandler: ProxyHandler<any> = {
            get: (target, prop) => {
                if (prop === 'then') return undefined; // Promise interop
                if (['findUnique', 'findFirst'].includes(prop as string)) return async () => null;
                if (['findMany'].includes(prop as string)) return async () => [];
                if (['create', 'update', 'delete', 'upsert'].includes(prop as string)) return async () => ({});
                if (['count'].includes(prop as string)) return async () => 0;
                if (prop === '$transaction') return async (cb: any) => cb(new Proxy({}, deepMockHandler));
                if (prop === '$connect' || prop === '$disconnect') return async () => {};
                
                return new Proxy({}, deepMockHandler);
            }
        };
        
        return new Proxy({}, deepMockHandler) as any;
    }

    const cleanConnectionString = connectionString.trim().replace(/[\r\n]/g, '')

    const pool = new Pool({
        connectionString: cleanConnectionString,
        ssl: { rejectUnauthorized: false },
        max: 3, 
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
