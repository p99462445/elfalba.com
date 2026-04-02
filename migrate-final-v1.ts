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
    const membersSheet = membersBook.Sheets['Member_20260316_from_ _tmp_k88m'];

    const jobsData: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });
    const membersData: any[][] = XLSX.utils.sheet_to_json(membersSheet, { header: 1 });

    const targets = [1, 2, 3]; // Row 2, 3, 4 in Excel

    for (const idx of targets) {
        const row = jobsData[idx];
        if (!row) continue;

        const targetId = row[1]; // B열
        console.log(`\n--- Migrating: ${targetId} (Row ${idx + 1}) ---`);

        // Find Member in 50k DB (Id: C열, Index 2)
        const memberRow = membersData.find(m => m[2] === targetId);

        const email = `${targetId}@badalba.com`;
        const jobTitle = row[15] || row[2]; // P열(제목) 우선, 없으면 C열
        const bizName = row[2]; // C열
        const companyName = row[5]; // F열
        const address = row[7]; // H열
        const managerName = row[12]; // M열 (기존악녀DB 우선)
        const managerPhone = row[13]; // N열 (기존악녀DB 우선)
        const description = hybridClean(row[16] || ""); // Q열

        // Upsert User
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                real_name: managerName || (memberRow ? memberRow[3] : "미지정"),
                phone: managerPhone || (memberRow ? memberRow[6] : "010-0000-0000"),
                birthdate: memberRow ? memberRow[8]?.toString() : null,
                is_adult: true,
                verified_at: new Date()
            },
            create: {
                email,
                password: 'migrated_user_password_placeholder',
                role: 'EMPLOYER',
                nickname: targetId,
                real_name: managerName || (memberRow ? memberRow[3] : "미지정"),
                phone: managerPhone || (memberRow ? memberRow[6] : "010-0000-0000"),
                birthdate: memberRow ? memberRow[8]?.toString() : null,
                is_adult: true,
                verified_at: new Date()
            }
        });

        // Upsert Employer
        const employer = await prisma.employer.upsert({
            where: { user_id: user.id },
            update: {
                business_name: companyName || bizName,
                owner_name: user.real_name,
                phone: user.phone,
                verification_status: 'APPROVED'
            },
            create: {
                user_id: user.id,
                business_name: companyName || bizName,
                owner_name: user.real_name,
                phone: user.phone,
                verification_status: 'APPROVED'
            }
        });

        // Metadata
        const karaoke = await prisma.jobCategory.findUnique({ where: { slug: 'karaoke' } });
        const seoul = await prisma.region.findUnique({ where: { slug: 'seoul' } });
        if (!karaoke || !seoul) throw new Error("Metadata missing.");

        // Exposure Logic (D열)
        const rawExposure = row[3] || '';
        let exposureLevel: any = 'GENERAL';
        if (rawExposure.includes('프리미엄')) exposureLevel = 'VVIP';
        else if (rawExposure.includes('추천')) exposureLevel = 'VIP';

        // Salary Logic (K, L열)
        const salaryAmount = parseInt(row[10]?.toString().replace(/[^0-9]/g, '')) || 0;
        const rawSalaryType = row[11] || '';
        let salaryType: any = 'NEGOTIABLE';
        if (rawSalaryType.includes('시급')) salaryType = 'HOURLY';
        else if (rawSalaryType.includes('TC')) salaryType = 'TC';

        const finalSalaryInfo = salaryType === 'NEGOTIABLE' ? '협의' : `${row[11] || ''} ${row[10] || ''}`.trim();

        // Job Update
        await prisma.job.upsert({
            where: { legacy_id: parseInt(row[0]) }, // A열
            update: {
                employer_id: employer.id,
                title: jobTitle,
                description: description,
                salary_type: salaryType,
                salary_info: finalSalaryInfo,
                salary_amount: salaryAmount,
                exposure_level: exposureLevel,
                category_id: karaoke.id,
                region_id: seoul.id,
                status: 'ACTIVE',
                expired_at: new Date(1782518400000), // 2026 Placeholder
                last_jumped_at: new Date()
            },
            create: {
                legacy_id: parseInt(row[0]),
                employer_id: employer.id,
                title: jobTitle,
                description: description,
                salary_type: salaryType,
                salary_info: finalSalaryInfo,
                salary_amount: salaryAmount,
                exposure_level: exposureLevel,
                category_id: karaoke.id,
                region_id: seoul.id,
                status: 'ACTIVE',
                expired_at: new Date(1782518400000),
                last_jumped_at: new Date()
            }
        });
        console.log(`Success: ${targetId} migrated with salary info: ${finalSalaryInfo}`);
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
아니생각나는건없구 더좋은수있나
생각해봐



