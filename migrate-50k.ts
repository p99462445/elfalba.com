import prisma from './src/lib/prisma';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

async function run() {
    console.log('--- 🚀 50k High-Speed Migration (v2 - Fixed IDs) Started ---');
    const membersPath = 'C:\\Users\\박근홍\\Desktop\\악녀디비\\회원5만명DB.xlsx';

    console.log('Loading Excel file...');
    const membersBook = XLSX.readFile(membersPath);
    const sheet = membersBook.Sheets[membersBook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1);
    console.log(`Loaded ${dataRows.length} users from Excel.`);

    const batchSize = 1000;
    let processed = 0;

    for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        
        let values: string[] = [];
        let params: any[] = [];
        let pIndex = 1;

        for (const row of batch) {
            const username = row[2]?.toString().trim();
            if (!username) continue;

            const name = row[3]?.toString().trim() || null;
            const phone = row[6]?.toString().trim() || null;
            const birthdate = row[8]?.toString().trim() || null;
            const id = randomUUID(); // Generate unique ID for raw SQL

            values.push(`($${pIndex}, $${pIndex+1}, $${pIndex+2}, $${pIndex+3}, $${pIndex+4}, false, now())`);
            params.push(id, username, name, birthdate, phone);
            pIndex += 5;
        }

        if (values.length > 0) {
            const sql = `
                INSERT INTO "public"."LegacyMember" (id, username, name, birthdate, phone, "is_migrated", "updated_at")
                VALUES ${values.join(', ')}
                ON CONFLICT (username) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    birthdate = EXCLUDED.birthdate,
                    phone = EXCLUDED.phone,
                    updated_at = now();
            `;
            await prisma.$executeRawUnsafe(sql, ...params);
        }

        processed += batch.length;
        if (processed % 5000 === 0 || processed === dataRows.length) {
            console.log(`Progress: ${processed} / ${dataRows.length} users synced...`);
        }
    }

    console.log('\n--- 🛠️ Syncing existing User table with Legacy Data ---');

    const usersToUpdate = await prisma.user.findMany({
        where: { birthdate: null },
        select: { id: true, email: true, nickname: true }
    });
    
    console.log(`Checking ${usersToUpdate.length} active users for repair...`);
    
    let updateCount = 0;
    for (const user of usersToUpdate) {
        let matchId = user.nickname || '';
        if (user.email.includes('@')) {
            const emailId = user.email.split('@')[0];
            matchId = emailId;
        }

        // Fast search in raw dataRows
        const legacyMatch = dataRows.find(m => m[2]?.toString().trim().toLowerCase() === matchId.toLowerCase());
        
        if (legacyMatch) {
            const birth = legacyMatch[8]?.toString().trim();
            const phone = legacyMatch[6]?.toString().trim();
            const realName = legacyMatch[3]?.toString().trim();

            if (birth) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        birthdate: birth,
                        phone: user.phone || phone,
                        real_name: user.real_name || realName,
                        old_id: matchId.toLowerCase(),
                        is_adult: true,
                        verified_at: user.verified_at || new Date()
                    }
                });
                updateCount++;
            }
        }
    }

    console.log(`\n✅ COMPLETED!`);
    console.log(`- ${dataRows.length} records imported to 'LegacyMember' table.`);
    console.log(`- ${updateCount} active users solved the 'empty birthdate' problem.`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
