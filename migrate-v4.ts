import prisma from './src/lib/prisma';
import * as XLSX from 'xlsx';
import { JSDOM } from 'jsdom';

function hybridClean(html: string) {
    if (!html) return "";
    let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n');
    const dom = new JSDOM(text);
    return dom.window.document.body.textContent?.trim() || "";
}

async function run() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';
    const membersPath = 'C:\\Users\\박근홍\\Desktop\\회원5만명DB.xlsx';

    const jobsBook = XLSX.readFile(jobsPath);
    const membersBook = XLSX.readFile(membersPath);

    const jobsSheet = jobsBook.Sheets['마감일남은공고목록'];
    const membersSheet = membersBook.Sheets[membersBook.SheetNames[0]];

    const jobsData: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });
    const membersData: any[][] = XLSX.utils.sheet_to_json(membersSheet, { header: 1 });

    // Target Rows: Row 2, 3, 4 (Excel counting) -> Arrays data[1], data[2], data[3]
    for (let i = 1; i <= 3; i++) {
        const row = jobsData[i];
        if (!row) continue;

        const targetId = row[1]; // B열: 회원ID
        console.log(`\n--- Migrating Row ${i + 1}: ${targetId} ---`);

        // Find Member in 50k DB (Id: C열, Index 2)
        const memberRow = membersData.find(m => m[2] === targetId);

        const email = `${targetId}@badalba.com`;
        const jobTitle = row[15] || row[2]; // P열(글제목) 우선, 없으면 C열(공고상호)
        const bizName = row[2]; // C열: 공고상호명
        const companyName = row[5]; // F열: 사업자상호명
        const address = row[7]; // H열: 주소
        const managerName = row[12]; // M열: 담당자이름 (기존악녀DB 우선)
        const managerPhone = row[13]; // N열: 담당자HP (기존악녀DB 우선)
        const description = hybridClean(row[16] || ""); // Q열: 모집내용

        // Upsert User
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                real_name: memberRow ? memberRow[3] : managerName, // D열: 이름
                phone: managerPhone,
                birthdate: memberRow ? memberRow[8] : null, // I열: 생일
                is_adult: true,
                verified_at: new Date()
            },
            create: {
                email,
                password: 'migrated_user_password_placeholder',
                role: 'EMPLOYER',
                nickname: targetId,
                real_name: memberRow ? memberRow[3] : managerName,
                phone: managerPhone,
                birthdate: memberRow ? memberRow[8] : null,
                is_adult: true,
                verified_at: new Date()
            }
        });

        // Upsert Employer
        const employer = await prisma.employer.upsert({
            where: { user_id: user.id },
            update: {
                business_name: companyName || bizName,
                owner_name: memberRow ? memberRow[3] : managerName,
                phone: managerPhone,
                verification_status: 'APPROVED'
            },
            create: {
                user_id: user.id,
                business_name: companyName || bizName,
                owner_name: memberRow ? memberRow[3] : managerName,
                phone: managerPhone,
                verification_status: 'APPROVED'
            }
        });

        // Metadata
        const karaoke = await prisma.jobCategory.findUnique({ where: { slug: 'karaoke' } });
        const seoul = await prisma.region.findUnique({ where: { slug: 'seoul' } });
        if (!karaoke || !seoul) throw new Error("Metadata missing.");

        // Exposure Logic (D열: 진열위치)
        const rawExposure = row[3] || '';
        let exposureLevel: any = 'GENERAL';
        if (rawExposure.includes('프리미엄')) exposureLevel = 'VVIP';
        else if (rawExposure.includes('추천')) exposureLevel = 'VIP';

        // Legacy ID (A열: 고유번호/공고번호)
        const legacyId = parseInt(row[0]);

        // Salary Logic
        let salaryType: any = 'NEGOTIABLE';
        const rawSalaryType = row[9] || ''; // J열: 직종(대)? No, check peek-rows output again.
        // Wait, J, K, L are categories. Let's find where Salary is.
        // I'll check peek-rows output for Salary position.
        // Actually, based on previous turn, let's assume Row index for Salary.
        // I'll quickly peek one more time to be 100% sure on Salary columns.
    }
}
run();
