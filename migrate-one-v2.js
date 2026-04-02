require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { JSDOM } = require('jsdom');

function hybridClean(html) {
    if (!html) return "";
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Remove specific attributes
    const toRemove = ['style', 'color', 'face', 'size', 'bgcolor', 'background-color', 'class'];
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
        toRemove.forEach(attr => el.removeAttribute(attr));
        if (el.tagName.toLowerCase() === 'font') {
            // Unwrap font tags
            while (el.firstChild) {
                el.parentNode.insertBefore(el.firstChild, el);
            }
            el.parentNode.removeChild(el);
        }
    });

    return doc.body.innerHTML.trim();
}

async function main() {
    const legacyId = 8981; // hun268's job
    const memberId = 'hun268';
    const email = `${memberId}@badalba.com`;

    console.log(`Starting cleanup and re-migration for ${memberId}...`);

    // 1. Delete existing for fresh start
    // Use deleteMany to avoid error if it doesn't exist
    await prisma.job.deleteMany({ where: { legacy_id: legacyId } });

    // 2. Data for hun268 (Row 1 from Excel, already retrieved in previous steps)
    const row = {
        title: "신림/신대방 지역에서 잘 나가는 Cute 입니다.",
        manager_name: "이종훈",
        contact_value: "010-3345-2110",
        address: "서울 관악구", // From JSON "주소"
        business_name: "Cute",
        description_raw: `<font color="#000000" size="2"><b>림 / 신 -- [ 업소명 ] <br>안녕하세요~ 신림/신대방 지역에서 잘 나가는 Cute 입니다. <br>일단 전번부터 입력하세요~ 010 3345 2110 <br></b></font>`,
        salary_type: "NEGOTIABLE",
        exposure_level: "VVIP",
        category_id: 2, // 노래주점
        region_id: 1, // 서울
        expired_at: new Date(1782518400000)
    };

    // Clean description using JSDOM
    const cleanedDescription = hybridClean(row.description_raw);

    // 3. Upsert User
    const user = await prisma.user.upsert({
        where: { email },
        update: { is_adult: true, verified_at: new Date() },
        create: {
            email,
            password: 'migrated_user_password_placeholder',
            role: 'EMPLOYER',
            nickname: memberId,
            is_adult: true,
            verified_at: new Date()
        }
    });

    // 4. Upsert Employer
    const employer = await prisma.employer.upsert({
        where: { user_id: user.id },
        update: {
            business_name: row.business_name,
            address: row.address + " 16-7", // Refined mapping
            address_detail: null, // As requested
            owner_name: row.manager_name,
            is_verified: true
        },
        create: {
            user_id: user.id,
            business_name: row.business_name,
            address: row.address + " 16-7",
            address_detail: null,
            owner_name: row.manager_name,
            is_verified: true
        }
    });

    // 5. Create Job
    const job = await prisma.job.create({
        data: {
            legacy_id: legacyId,
            employer_id: employer.id,
            title: row.title,
            description: cleanedDescription,
            manager_name: row.manager_name,
            contact_value: row.contact_value,
            salary_type: row.salary_type,
            exposure_level: row.exposure_level,
            category_id: row.category_id,
            region_id: row.region_id,
            status: 'ACTIVE',
            expired_at: row.expired_at,
            last_jumped_at: new Date()
        }
    });

    console.log(`Successfully re-migrated Job ID: ${job.id}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
