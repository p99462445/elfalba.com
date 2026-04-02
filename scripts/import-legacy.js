const { Client } = require('pg');
const xlsx = require('xlsx');
require('dotenv').config({ path: '.env' });

async function importLegacy() {
    const filePath = "C:\\Users\\박근홍\\Desktop\\회원샘플.xlsx";
    console.log(`Reading file: ${filePath}`);

    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log(`Found ${data.length} records in Excel. Connecting to database...`);
        await client.connect();

        for (const row of data) {
            const username = row['아이디']?.toString().trim();
            if (!username) continue;

            const name = row['이름']?.toString().trim();
            const birthdate = row['생일']?.toString().trim();
            const phone = row['핸드폰']?.toString().trim();
            const role = row['회원유형']?.toString().trim();

            const sql = `
                INSERT INTO "public"."LegacyMember" (id, username, name, birthdate, phone, role, updated_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
                ON CONFLICT (username) DO UPDATE SET
                    name = EXCLUDED.name,
                    birthdate = EXCLUDED.birthdate,
                    phone = EXCLUDED.phone,
                    role = EXCLUDED.role,
                    updated_at = NOW();
            `;

            await client.query(sql, [username, name, birthdate, phone, role]);
        }

        console.log(`✅ ${data.length} records imported/updated successfully.`);

    } catch (err) {
        console.error('❌ Error during import:', err);
    } finally {
        await client.end();
    }
}

importLegacy();
