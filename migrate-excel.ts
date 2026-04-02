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

    console.log('Loading Excel files...');
    const jobsBook = XLSX.readFile(jobsPath);
    const membersBook = XLSX.readFile(membersPath);

    const jobsData: any[] = XLSX.utils.sheet_to_json(jobsBook.Sheets[jobsBook.SheetNames[0]]);
    const membersData: any[] = XLSX.utils.sheet_to_json(membersBook.Sheets[membersBook.SheetNames[0]]);

    console.log(`Loaded ${jobsData.length} jobs and ${membersData.length} members.`);

    const targets = ['mongtaju77', 'hwangkar'];

    for (const targetId of targets) {
        console.log(`\n--- Proceeding with: ${targetId} ---`);

        // 1. Find Member Info
        const memberInfo = membersData.find(m => m['아이디'] === targetId);
        if (!memberInfo) {
            console.warn(`Member ${targetId} not found in 50k DB.`);
            continue;
        }

        // 2. Find Job Info
        const jobInfo = jobsData.find(j => j['회원ID'] === targetId);
        if (!jobInfo) {
            console.warn(`Job for ${targetId} not found in Jobs DB.`);
            continue;
        }

        const email = `${targetId}@badalba.com`;

        // 3. Upsert User
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                real_name: memberInfo['이름'],
                phone: memberInfo['핸드폰'],
                birthdate: memberInfo['생일'],
                is_adult: true,
                verified_at: new Date()
            },
            create: {
                email,
                password: 'migrated_user_password_placeholder',
                role: 'EMPLOYER',
                nickname: targetId,
                real_name: memberInfo['이름'],
                phone: memberInfo['핸드폰'],
                birthdate: memberInfo['생일'],
                is_adult: true,
                verified_at: new Date()
            }
        });
        console.log(`User ${targetId} registered/updated.`);

        // 4. Upsert Employer
        const employer = await prisma.employer.upsert({
            where: { user_id: user.id },
            update: {
                business_name: jobInfo['사업자상호명'] || jobInfo['공고상호명'],
                owner_name: memberInfo['이름'],
                phone: memberInfo['핸드폰'],
                verification_status: 'APPROVED'
            },
            create: {
                user_id: user.id,
                business_name: jobInfo['사업자상호명'] || jobInfo['공고상호명'],
                owner_name: memberInfo['이름'],
                phone: memberInfo['핸드폰'],
                verification_status: 'APPROVED'
            }
        });

        // 5. Metadata Resolution
        const karaoke = await prisma.jobCategory.findUnique({ where: { slug: 'karaoke' } });
        const seoul = await prisma.region.findUnique({ where: { slug: 'seoul' } });
        if (!karaoke || !seoul) throw new Error("Metadata missing.");

        // 6. Job Data Prep
        const cleanedDescription = hybridClean(jobInfo['모집내용'] || "");
        const legacyId = parseInt(jobInfo['고유번호/공고번호']);

        let salaryType: any = 'NEGOTIABLE';
        const rawSalaryType = jobInfo['급여/급여유형'] || '';
        if (rawSalaryType.includes('시급')) salaryType = 'HOURLY';
        else if (rawSalaryType.includes('TC')) salaryType = 'TC';

        let exposureLevel: any = 'GENERAL';
        const rawExposure = jobInfo['진열위치'] || '';
        if (rawExposure.includes('프리미엄')) exposureLevel = 'VVIP';
        else if (rawExposure.includes('추천')) exposureLevel = 'VIP';

        // 7. Upsert Job
        await prisma.job.upsert({
            where: { legacy_id: legacyId },
            update: {
                employer_id: employer.id,
                title: jobInfo['공고상호명'],
                description: cleanedDescription,
                salary_type: salaryType,
                salary_info: salaryType === 'NEGOTIABLE' ? '협의' : (jobInfo['급여/금액'] || ''),
                exposure_level: exposureLevel,
                category_id: karaoke.id,
                region_id: seoul.id,
                status: 'ACTIVE',
                expired_at: new Date(1782518400000), // Placeholder
                last_jumped_at: new Date()
            },
            create: {
                legacy_id: legacyId,
                employer_id: employer.id,
                title: jobInfo['공고상호명'],
                description: cleanedDescription,
                salary_type: salaryType,
                salary_info: salaryType === 'NEGOTIABLE' ? '협의' : (jobInfo['급여/금액'] || ''),
                exposure_level: exposureLevel,
                category_id: karaoke.id,
                region_id: seoul.id,
                status: 'ACTIVE',
                expired_at: new Date(1782518400000),
                last_jumped_at: new Date()
            }
        });
        console.log(`Job for ${targetId} ("${jobInfo['공고상호명']}") migrated.`);
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
