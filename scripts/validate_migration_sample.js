require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function main() {
    const csvFile = 'test_users_final_fixed.csv';
    const fileContent = fs.readFileSync(csvFile, 'utf8');

    // Improved simple CSV parser
    const lines = fileContent.split('\n').filter(line => line.trim());

    function parseLine(line) {
        if (!line) return [];
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(s => s.replace(/^"|"$/g, ''));
    }

    const headers = parseLine(lines[0]);

    // Find User kkhhss2501
    const targetId = 'kkhhss2501';
    let targetRow = null;

    for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => row[h] = cols[idx]);
        if (row['아이디'] === targetId) {
            targetRow = row;
            break;
        }
    }

    if (!targetRow) {
        console.error(`User ${targetId} not found in CSV.`);
        process.exit(1);
    }

    // 100% STRICT MAPPING according to instructions
    const 아이디 = targetRow['아이디'];
    const fakeEmail = `${아이디}@old.badalba.com`;
    const password = "000000";

    const supabasePayload = {
        email: fakeEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
            old_id: 아이디,
            nickname: targetRow['상호'] || '회원', // 엑셀 '상호' ➔ User.nickname
        }
    };

    const isAdult = targetRow['실명인증여부'] === '휴대폰 인증';
    const gender = targetRow['성별'] === '1' ? 'MALE' : (targetRow['성별'] === '2' ? 'FEMALE' : 'OTHER');

    const prismaPayload = {
        email: fakeEmail,
        role: 'EMPLOYER', // 하드코딩
        old_id: 아이디,
        contact_email: targetRow['이-메일'],
        real_name: targetRow['이름'],
        nickname: targetRow['상호'], // 엑셀 '상호' ➔ User.nickname
        phone: targetRow['핸드폰'],
        gender: gender,
        is_adult: isAdult,
        employer: {
            create: {
                // 엑셀 '업종' ➔ Employer.business_name
                // 만약 '업종' 컬럼이 없으면 undefined 가 출력되어 사용자에게 피드백을 줍니다.
                business_name: targetRow['업종'] || '상호명 미등록',
                business_number: targetRow['사업자번호'],
                address: `${targetRow['주소'] || ''} ${targetRow['나머지주소'] || ''}`.trim(),
            }
        }
    };

    console.log('--- CSV HEADERS DETECTED ---');
    console.log(headers.join(', '));
    console.log('\n--- TARGET USER: ' + targetId + ' ---');
    console.log('--- Supabase Auth Payload (Strict) ---');
    console.log(JSON.stringify(supabasePayload, null, 2));
    console.log('\n--- Prisma Payload (Strict) ---');
    console.log(JSON.stringify(prismaPayload, null, 2));
}

main().catch(console.error);
