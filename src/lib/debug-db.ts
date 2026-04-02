import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Now import prisma AFTER env is loaded
import prisma from '@/lib/prisma'

async function checkDb() {
    try {
        const employers = await prisma.employer.findMany({
            include: { user: true }
        })
        console.log(`Total Employers: ${employers.length}`)
        employers.forEach(e => {
            console.log(`- EmployerID: ${e.id}, UserID: ${e.user_id}, Name: ${e.business_name}, Email: ${e.user?.email}`)
        })

        const users = await prisma.user.findMany()
        console.log(`Total Users: ${users.length}`)
        users.forEach(u => {
            console.log(`- UserID: ${u.id}, Email: ${u.email}, Role: ${u.role}`)
        })
    } catch (err: any) {
        console.error("DB Check Error:", err.message)
    } finally {
        await prisma.$disconnect()
    }
}

checkDb()
