import prisma from './src/lib/prisma';
import * as XLSX from 'xlsx';
import { JSDOM } from 'jsdom';

// === KOREAN JOB POSTING SMART FORMATTER (v7) ===
function smartFormat(text: string): string {
    if (!text) return "";

    let t = text;

    // 1. Handle ^^ and ~~ as sentence-ending cues → replace with newline
    t = t.replace(/(\^\^|~~)+/g, '\n');

    // 2. Insert newline before inline numbered sections WITHOUT spaces (e.g. 1.시간당기본2.교통비)
    //    Match: digit(s) + period/dot + Korean text, preceded by non-newline content
    t = t.replace(/([^\n])([0-9]+\.[가-힣\s*])/g, (_, before, numbered) => `${before}\n${numbered}`);

    // 3. Insert newline before phone numbers (010-XXXX, 02-XXXX, etc.)
    t = t.replace(/([^\n])(0[0-9]{1,2}[-–][0-9]{3,4}[-–][0-9]{4})/g, (_, b, phone) => `${b}\n${phone}`);

    // 4. Insert newline before KakaoTalk IDs (카카오, 카톡, 오픈채팅)
    t = t.replace(/([^\n])(카카오|카톡|오픈채팅|오픈톡)/g, (_, b, kw) => `${b}\n${kw}`);

    // 5. Handle **bold** markdown pattern — add newlines around bolded sections
    t = t.replace(/\*\*([^*]+)\*\*/g, (_, inner) => `\n${inner}\n`);

    // 6. Insert newline before key section separator characters
    t = t.replace(/([^\n])([●▶■◆◇▷▸※◎○★♥♡💰💎📞📱✔✅])/g, (_, b, sym) => `${b}\n${sym}`);

    // 7. Split into lines, trim each, filter empty, re-add paragraph spacing
    const lines = t.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const result: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const prev = result[result.length - 1];

        // Add blank line before section starters (numbered, emoji, bullets)
        const isSectionStart =
            /^[0-9]+[.)]\s/.test(line) ||
            /^[0-9]+[\.\s][가-힣]/.test(line) ||
            /^[★♥♡💰💎📞📱✔✅🔴🔵⭕💖💗❤🧡💛💚💙💜🖤🤍🤎🎁🎀🎊🎉🌟✨💫⚡🌈🌺🌸🌹🍀]/.test(line) ||
            /^[●▶■◆◇▷▸※◎○←→↑↓]/.test(line) ||
            /^[-=]{3,}/.test(line);

        if (isSectionStart && prev && prev !== '') {
            result.push('');
        }

        result.push(line);
    }

    return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// === HTML CLEANER: removes style/script, extracts text with line breaks preserved ===
function smartClean(html: string): string {
    if (!html) return "";

    // 1. Rescue text from HTML comments
    let rescued = "";
    const commentRegex = /<!--([\s\S]*?)-->/g;
    let m;
    while ((m = commentRegex.exec(html)) !== null) {
        const c = m[1].trim();
        if (c.length > 5 && (/[가-힣]/.test(c) || /010/.test(c))) {
            rescued += c + "\n";
        }
    }

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // 2. Remove junk tags
    ['style', 'script', 'meta', 'link', 'title', 'iframe', 'object'].forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // 3. Replace block tags with newlines before extracting text
    const convertBlock = (selector: string, char: string) => {
        doc.querySelectorAll(selector).forEach(el => {
            el.insertAdjacentText('beforebegin', char);
        });
    };
    convertBlock('p', '\n');
    convertBlock('div', '\n');
    convertBlock('br', '\n');
    convertBlock('li', '\n- ');
    convertBlock('h1,h2,h3,h4,h5,h6', '\n\n');

    // 4. Get raw text
    const rawText = (rescued + "\n" + (doc.body.textContent || ""))
        .replace(/ {2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // 5. Apply smart Korean formatting
    return smartFormat(rawText);
}

function excelDateToJS(excelDate: any) {
    if (!excelDate) return new Date();
    if (typeof excelDate === 'number') {
        return new Date((excelDate - 25569) * 86400 * 1000);
    }
    return new Date(excelDate);
}

// Maps first Korean province/city name from I column to DB region slug
// Maps first Korean province/city name from I column to DB region slug
const PROVINCE_TO_ROOT: Record<string, string> = {
    '서울': '서울',
    '경기': '인천/경기',
    '인천': '인천/경기',
    '대전': '대전/세종/충청',
    '세종': '대전/세종/충청',
    '충남': '대전/세종/충청',
    '충북': '대전/세종/충청',
    '대구': '대구/경북',
    '경북': '대구/경북',
    '부산': '부산/울산/경남',
    '울산': '부산/울산/경남',
    '경남': '부산/울산/경남',
    '광주': '광주/전라',
    '전남': '광주/전라',
    '전북': '광주/전라',
    '강원': '제주/강원',
    '제주': '제주/강원',
};

function findRegionIds(iColValue: string | undefined, allRegions: any[]): number[] {
    if (!iColValue) return [];

    // Split by |, take first 3 if there are more
    const rawParts = iColValue.split('|').map(s => s.trim()).filter(Boolean);
    const entries = rawParts.slice(0, 3);

    const foundIds: number[] = [];

    for (const entry of entries) {
        const [province, city] = entry.split(',').map(s => s.trim());
        const rootName = PROVINCE_TO_ROOT[province];

        if (!city || city === "전체") {
            // Find a child of province root that matches the province name, or fallback to root
            const exactMatch = allRegions.find(r => r.name === province && (rootName ? r.parent?.name === rootName : true));
            if (exactMatch) {
                foundIds.push(exactMatch.id);
            } else {
                const root = allRegions.find(r => r.name === rootName && r.parent_id === null);
                if (root) foundIds.push(root.id);
            }
            continue;
        }

        const cityShort = city.replace(/(시|군|구)$/, ''); // Remove 시/군/구

        // 1. Precise Match in Province Group
        let match = allRegions.find(r => {
            const nameMatch = r.name.includes(cityShort);
            const parentMatch = rootName ? (r.parent?.name === rootName || r.name === rootName) : true;
            return nameMatch && parentMatch;
        });

        // 2. Fallback: match by city name anywhere
        if (!match) {
            match = allRegions.find(r => r.name.includes(cityShort));
        }

        // 3. Fallback: match by province name
        if (!match) {
            match = allRegions.find(r => r.name === province);
        }

        if (match) {
            foundIds.push(match.id);
        }
    }
    return [...new Set(foundIds)];
}

async function runMigration(filePath: string, sheetName: string, forcePremium = false) {
    console.log(`\n--- Migrating: ${sheetName} ---`);
    const membersPath = 'C:\\Users\\박근홍\\Desktop\\회원5만명DB.xlsx';

    const jobsBook = XLSX.readFile(filePath);
    const membersBook = XLSX.readFile(membersPath);

    const jobsData: any[][] = XLSX.utils.sheet_to_json(jobsBook.Sheets[sheetName], { header: 1 });
    const membersData: any[][] = XLSX.utils.sheet_to_json(membersBook.Sheets['Member_20260316_from_ _tmp_k88m'], { header: 1 });

    const allRegions = await prisma.region.findMany({ include: { parent: true } });
    const defaultRegion = allRegions.find(r => r.slug === 'seoul');
    const defaultCategory = await prisma.jobCategory.findFirst({ where: { slug: 'karaoke' } });

    let ok = 0, err = 0;

    for (let idx = 1; idx < jobsData.length; idx++) {
        const row = jobsData[idx];
        if (!row || !row[1]) continue;

        const targetId = row[1].toString();
        const legacyId = parseInt(row[0]);
        if (isNaN(legacyId)) continue;

        const memberRow = membersData.find(m => m[2]?.toString() === targetId);
        const email = `${targetId}@badalba.com`;
        const managerName = row[12];
        const managerPhone = row[13]?.toString();
        const title = row[15] || row[2];
        const bizName = row[2];
        const companyName = row[5];
        const address = row[7];
        const viewCount = parseInt(row[14]) || 0;
        const description = smartClean(row[16] || "");
        const expired_at = excelDateToJS(row[4]);
        const created_at = excelDateToJS(row[18]);
        const updated_at = excelDateToJS(row[17]);

        const phone = (managerPhone || (memberRow ? memberRow[6]?.toString() : "010-0000-0000") || "010-0000-0000");

        try {
            const user = await prisma.user.upsert({
                where: { email },
                update: { real_name: managerName || (memberRow ? memberRow[3] : "미지정"), phone, is_adult: true, verified_at: new Date() },
                create: { email, password: 'migrated_placeholder', role: 'EMPLOYER', nickname: targetId, real_name: managerName || (memberRow ? memberRow[3] : "미지정"), phone, is_adult: true, verified_at: new Date(), created_at }
            });

            const employer = await prisma.employer.upsert({
                where: { user_id: user.id },
                update: { business_name: companyName || bizName, owner_name: user.real_name, phone: user.phone, address, verification_status: 'APPROVED' },
                create: { user_id: user.id, business_name: companyName || bizName, owner_name: user.real_name, phone: user.phone, address, verification_status: 'APPROVED', created_at }
            });

            const rawExposure = row[3] || '';
            let exposureLevel: any = 'GENERAL';
            if (forcePremium) exposureLevel = 'VVIP';
            else if (rawExposure.includes('프리미엄')) exposureLevel = 'VVIP';
            else if (rawExposure.includes('추천')) exposureLevel = 'VIP';

            const salaryAmount = parseInt(row[10]?.toString().replace(/[^0-9]/g, '')) || 0;
            const rawSalaryType = row[11] || '';
            let salaryType: any = 'NEGOTIABLE';
            if (rawSalaryType.includes('시급')) salaryType = 'HOURLY';
            else if (rawSalaryType.includes('TC')) salaryType = 'TC';
            const finalSalaryInfo = salaryType === 'NEGOTIABLE' ? '협의' : `${rawSalaryType} ${row[10] || ''}`.trim();

            const foundCategory = await prisma.jobCategory.findFirst({ where: { name: { contains: row[9] || '' } } });
            const categoryId = foundCategory ? foundCategory.id : defaultCategory!.id;

            // --- Multi-Region Logic ---
            const regionIds = findRegionIds(row[8], allRegions);
            const mainRegionId = regionIds[0] || defaultRegion!.id;

            const job = await prisma.job.upsert({
                where: { legacy_id: legacyId },
                update: {
                    employer_id: employer.id, title, business_name: bizName, description, manager_name: managerName, contact_value: managerPhone,
                    salary_type: salaryType, salary_info: finalSalaryInfo, salary_amount: salaryAmount, exposure_level: exposureLevel,
                    category_id: categoryId, region_id: mainRegionId, view_count: viewCount, status: 'ACTIVE', expired_at, created_at, updated_at
                },
                create: {
                    legacy_id: legacyId, employer_id: employer.id, category_id: categoryId, region_id: mainRegionId, title, business_name: bizName,
                    description, manager_name: managerName, contact_value: managerPhone, salary_type: salaryType, salary_info: finalSalaryInfo,
                    salary_amount: salaryAmount, exposure_level: exposureLevel, view_count: viewCount, status: 'ACTIVE', expired_at, created_at, updated_at
                }
            });

            // Sync JobRegions (Many-to-Many)
            if (regionIds.length > 0) {
                // Clear existing and add new
                await prisma.jobRegion.deleteMany({ where: { job_id: job.id } });
                await prisma.jobRegion.createMany({
                    data: regionIds.map(id => ({ job_id: job.id, region_id: id }))
                });
            }

            ok++;
        } catch (error: any) {
            console.error(`  ERROR [${legacyId}] ${targetId}:`, error.message?.split('\n')[0]);
            err++;
        }
    }
    console.log(`  Done: ${ok} OK, ${err} errors`);
}

async function main() {
    await runMigration('C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx', '마감일남은공고목록', false);
    await runMigration('C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx', 'job_output_data_20260323', true); // All VVIP
    const total = await prisma.job.count();
    console.log(`\n✅ Smart Migration v7 Finished. Total jobs: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
