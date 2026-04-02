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

function excelDateToJS(excelDate: any) {
    if (!excelDate) return new Date();
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date;
    }
    return new Date(excelDate);
}

async function run() {
    console.log('--- Full Migration Script Started (v4 - Valid IDs) ---');
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';
    const membersPath = 'C:\\Users\\박근홍\\Desktop\\회원5만명DB.xlsx';

    const jobsBook = XLSX.readFile(jobsPath);
    const membersBook = XLSX.readFile(membersPath);

    const jobsSheet = jobsBook.Sheets['마감일남은공고목록'];
    const membersSheet = membersBook.Sheets['Member_20260316_from_ _tmp_k88m'];

    const jobsData: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });
    const membersData: any[][] = XLSX.utils.sheet_to_json(membersSheet, { header: 1 });

    // Pre-fetch metadata to avoid FK issues
    const defaultRegion = await prisma.region.findFirst({ where: { slug: 'seoul' } });
    const defaultCategory = await prisma.jobCategory.findFirst({ where: { slug: 'karaoke' } });
    if (!defaultRegion || !defaultCategory) throw new Error("Default Region or Category missing in DB!");

    const targets = [1, 2, 3]; // Row 2, 3, 4 in Excel

    for (const idx of targets) {
        const row = jobsData[idx];
        if (!row) continue;

        const targetId = row[1]; // B
        const legacyId = parseInt(row[0]); // A
        console.log(`\nMatching Row ${idx + 1}: ID ${targetId}, No ${legacyId}`);

        const memberRow = membersData.find(m => m[2] === targetId);

        const email = `${targetId}@badalba.com`;
        const managerName = row[12]; // M
        const managerPhone = row[13]; // N
        const title = row[15] || row[2]; // P (Title) or C (BizName)
        const bizName = row[2]; // C
        const companyName = row[5]; // F
        const address = row[7]; // H
        const viewCount = parseInt(row[14]) || 0; // O
        const description = hybridClean(row[16] || ""); // Q
        const expired_at = excelDateToJS(row[4]); // E
        const updated_at = excelDateToJS(row[17]); // R
        const created_at = excelDateToJS(row[18]); // S

        // User
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
                verified_at: new Date(),
                created_at: created_at
            }
        });

        // Employer
        const employer = await prisma.employer.upsert({
            where: { user_id: user.id },
            update: {
                business_name: companyName || bizName,
                owner_name: user.real_name,
                phone: user.phone,
                address: address,
                verification_status: 'APPROVED'
            },
            create: {
                user_id: user.id,
                business_name: companyName || bizName,
                owner_name: user.real_name,
                phone: user.phone,
                address: address,
                verification_status: 'APPROVED',
                created_at: created_at
            }
        });

        // Exposure (D)
        const rawExposure = row[3] || '';
        let exposureLevel: any = 'GENERAL';
        if (rawExposure.includes('프리미엄')) exposureLevel = 'VVIP';
        else if (rawExposure.includes('추천')) exposureLevel = 'VIP';

        // Salary (K, L)
        const salaryAmount = parseInt(row[10]?.toString().replace(/[^0-9]/g, '')) || 0;
        const rawSalaryType = row[11] || '';
        let salaryType: any = 'NEGOTIABLE';
        if (rawSalaryType.includes('시급')) salaryType = 'HOURLY';
        else if (rawSalaryType.includes('TC')) salaryType = 'TC';
        const finalSalaryInfo = salaryType === 'NEGOTIABLE' ? '협의' : `${rawSalaryType} ${row[10] || ''}`.trim();

        // Category (J)
        const rawCategory = row[9] || '';
        const foundCategory = await prisma.jobCategory.findFirst({ where: { name: { contains: rawCategory } } });
        const categoryId = foundCategory ? foundCategory.id : defaultCategory.id;

        // Job
        await prisma.job.upsert({
            where: { legacy_id: legacyId },
            update: {
                employer_id: employer.id,
                title,
                business_name: bizName,
                description,
                manager_name: managerName,
                contact_value: managerPhone,
                salary_type: salaryType,
                salary_info: finalSalaryInfo,
                salary_amount: salaryAmount,
                exposure_level: exposureLevel,
                category_id: categoryId,
                region_id: defaultRegion.id,
                view_count: viewCount,
                status: 'ACTIVE',
                expired_at,
                created_at: created_at,
                updated_at: updated_at
            },
            create: {
                legacy_id: legacyId,
                employer_id: employer.id,
                category_id: categoryId,
                region_id: defaultRegion.id,
                title,
                business_name: bizName,
                description,
                manager_name: managerName,
                contact_value: managerPhone,
                salary_type: salaryType,
                salary_info: finalSalaryInfo,
                salary_amount: salaryAmount,
                exposure_level: exposureLevel,
                view_count: viewCount,
                status: 'ACTIVE',
                expired_at,
                created_at: created_at,
                updated_at: updated_at
            }
        });
        console.log(`- OK [No ${legacyId}] ${targetId} Migrated with full info.`);
    }
    console.log('\n--- Migration Finished Successfully ---');
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
