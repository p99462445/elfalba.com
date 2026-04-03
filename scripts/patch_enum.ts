import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // PostgreSQL에서 Enum에 값을 추가하는 방식 (중복 방지 체크 포함)
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type t 
                               JOIN pg_enum e ON t.oid = e.enumtypid 
                               WHERE t.typname = 'SalaryType' AND e.enumlabel = 'MONTHLY') THEN
                    ALTER TYPE "SalaryType" ADD VALUE 'MONTHLY';
                END IF;
            END
            $$;
        `);
        console.log('Successfully added MONTHLY to SalaryType enum');
    } catch (error) {
        console.error('Error adding enum value:', error);
    } finally {
        await prisma.$disconnect()
    }
}

main();
