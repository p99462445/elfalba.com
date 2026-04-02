import prisma from './src/lib/prisma';
import * as XLSX from 'xlsx';
import { JSDOM } from 'jsdom';

function superAdvancedClean(html: string) {
    if (!html) return "";

    // Rescue text from comments first
    let rescuedComments = "";
    const commentRegex = /<!--([\s\S]*?)-->/g;
    let match;
    while ((match = commentRegex.exec(html)) !== null) {
        const commentContent = match[1].trim();
        if (commentContent.length > 5 && (/[가-힣]/.test(commentContent) || /[010]/.test(commentContent))) {
            rescuedComments += commentContent + "\n";
        }
    }

    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove style, script, etc.
    const tagsToRemove = ['style', 'script', 'meta', 'link', 'title'];
    tagsToRemove.forEach(tagName => {
        const elements = document.querySelectorAll(tagName);
        elements.forEach(el => el.remove());
    });

    let bodyText = document.body.textContent || "";

    // Combine rescued comments and body text
    let finalSelection = (rescuedComments + "\n" + bodyText).trim();

    // Final CSS Junk filter: Remove lines starting with . or # that look like CSS
    const lines = finalSelection.split('\n');
    const cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (trimmed.includes('{') && trimmed.includes('}')) return false;
        if (trimmed.startsWith('.bb-wrap')) return false;
        if (trimmed.startsWith('.font-family')) return false;
        return true;
    });

    return cleanedLines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
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
    console.log('--- Premium Ads Migration Started ---');
    const premiumPath = 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx';
    const membersPath = 'C:\\Users\\박근홍\\Desktop\\회원5만명DB.xlsx';

    const jobsBook = XLSX.readFile(premiumPath);
    const membersBook = XLSX.readFile(membersPath);

    const jobsSheet = jobsBook.Sheets['job_output_data_20260323'];
    const membersSheet = membersBook.Sheets['Member_20260316_from_ _tmp_k88m'];

    const jobsData: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });
    const membersData: any[][] = XLSX.utils.sheet_to_json(membersSheet, { header: 1 });

    const defaultRegion = await prisma.region.findFirst({ where: { slug: 'seoul' } });
    const defaultCategory = await prisma.jobCategory.findFirst({ where: { slug: 'karaoke' } });
    if (!defaultRegion || !defaultCategory) throw new Error("Metadata missing.");

    // Row 1 is header, start from idx 1
    for (let idx = 1; idx < jobsData.length; idx++) {
        const row = jobsData[idx];
        if (!row || !row[1]) continue;

        const targetId = row[1]; // B
        const legacyId = parseInt(row[0]); // A
        if (isNaN(legacyId)) continue;

        const memberRow = membersData.find(m => m[2] === targetId);
        const email = `${targetId}@badalba.com`;
        const managerName = row[12]; // M
        const managerPhone = row[13]; // N
        const title = row[15] || row[2]; // P
        const bizName = row[2]; // C
        const companyName = row[5]; // F
        const address = row[7]; // H
        const viewCount = parseInt(row[14]) || 0; // O
        const description = superAdvancedClean(row[16] || ""); // Q
        const expired_at = excelDateToJS(row[4]); // E
        const updated_at = excelDateToJS(row[17]); // R
        const created_at = excelDateToJS(row[18]); // S

        try {
            const user = await prisma.user.upsert({
                where: { email },
                update: {
                    real_name: managerName || (memberRow ? memberRow[3] : "미지정"),
                    phone: managerPhone || (memberRow ? memberRow[6] : "010-0000-0000"),
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
                    is_adult: true,
                    verified_at: new Date(),
                    created_at: created_at
                }
            });

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

            const rawExposure = row[3] || '';
            let exposureLevel: any = 'GENERAL';
            if (rawExposure.includes('프리미엄')) exposureLevel = 'VVIP';
            else if (rawExposure.includes('추천')) exposureLevel = 'VIP';

            const salaryAmount = parseInt(row[10]?.toString().replace(/[^0-9]/g, '')) || 0;
            const rawSalaryType = row[11] || '';
            let salaryType: any = 'NEGOTIABLE';
            if (rawSalaryType.includes('시급')) salaryType = 'HOURLY';
            else if (rawSalaryType.includes('TC')) salaryType = 'TC';
            const finalSalaryInfo = salaryType === 'NEGOTIABLE' ? '협의' : `${rawSalaryType} ${row[10] || ''}`.trim();

            const rawCategory = row[9] || '';
            const foundCategory = await prisma.jobCategory.findFirst({ where: { name: { contains: rawCategory } } });
            const categoryId = foundCategory ? foundCategory.id : defaultCategory.id;

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
            console.log(`- OK [No ${legacyId}] ${targetId} Premium Migrated.`);
        } catch (error) {
            console.error(`- ERROR ${targetId}:`, error);
        }
    }
    console.log('\n--- Premium Ads Migration Finished ---');
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
