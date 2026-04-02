import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'

const prisma = new PrismaClient()

async function main() {
    // 1. Read Excel file from Desktop
    const filePath = "C:\\Users\\박근홍\\Desktop\\회원샘플.xlsx"
    console.log(`Reading file: ${filePath}`)

    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 2. Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet)
    console.log(`Found ${data.length} records in Excel.`)

    // 3. Import each row to LegacyMember table
    for (const row of data as any) {
        // Column mapping based on Excel headers provided by user
        const username = row['아이디']?.toString().trim()
        if (!username) continue

        const name = row['이름']?.toString().trim()
        const birthdate = row['생일']?.toString().trim() // Expecting 2002-11-08 format
        const phone = row['핸드폰']?.toString().trim()
        const roleStr = row['회원유형']?.toString().trim()

        // Sync to DB
        await prisma.legacyMember.upsert({
            where: { username },
            update: {
                name,
                birthdate,
                phone,
                role: roleStr,
                updated_at: new Date()
            },
            create: {
                username,
                name,
                birthdate,
                phone,
                role: roleStr,
            }
        })
    }

    console.log("✅ Data import to staging table completed successfully.")
}

main()
    .catch(e => {
        console.error("❌ Error during import:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
