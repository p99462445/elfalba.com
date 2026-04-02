import prisma from './src/lib/prisma';
import { JSDOM } from 'jsdom';

function hybridClean(html: string) {
    if (!html) return "";

    // Replace <br>, <p>, <div> with newlines
    let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n');

    // Strip all other tags
    const dom = new JSDOM(text);
    return dom.window.document.body.textContent?.trim() || "";
}

async function migrateJob(memberId: string) {
    console.log(`--- Migrating Job for Member: ${memberId} ---`);

    // 0. Fetch real data from LegacyJob table
    const legacyRows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT * FROM "LegacyJob" WHERE member_id = '${memberId}'`
    );
    if (!legacyRows || legacyRows.length === 0) {
        console.warn(`Legacy data for ${memberId} not found.`);
        return;
    }
    const legacyRow = legacyRows[0];
    const legacyId = legacyRow.id;
    const email = `${memberId}@badalba.com`;

    // 1. Resolve IDs dynamically
    const karaoke = await prisma.jobCategory.findUnique({ where: { slug: 'karaoke' } });
    const seoul = await prisma.region.findUnique({ where: { slug: 'seoul' } });
    if (!karaoke || !seoul) throw new Error("Metadata missing.");

    // 2. Data Preparation
    const cleanedDescription = hybridClean(legacyRow.description_raw);

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
            business_name: legacyRow.business_name,
            address: legacyRow.address,
            address_detail: null, // Clear per user request (Excel update)
            owner_name: legacyRow.manager_name,
            verification_status: 'APPROVED'
        },
        create: {
            user_id: user.id,
            business_name: legacyRow.business_name,
            address: legacyRow.address,
            address_detail: null,
            owner_name: legacyRow.manager_name,
            verification_status: 'APPROVED'
        }
    });

    // 5. Upsert Job (Check by legacy_id)
    let existingJob = await prisma.job.findUnique({ where: { legacy_id: legacyId } });

    // Fallback: Check by employer_id if legacy_id was missing (for earlier trials)
    if (!existingJob) {
        const jobs = await prisma.job.findMany({ where: { employer_id: employer.id } });
        if (jobs.length > 0) existingJob = jobs[0];
    }

    if (existingJob) {
        await prisma.job.update({
            where: { id: existingJob.id },
            data: {
                legacy_id: legacyId,
                employer_id: employer.id,
                title: legacyRow.title,
                description: cleanedDescription,
                manager_name: legacyRow.manager_name,
                contact_value: legacyRow.contact_value,
                salary_info: legacyRow.salary_info || '협의',
                salary_type: (legacyRow.salary_type || 'NEGOTIABLE') as any,
                exposure_level: 'VVIP',
                category_id: karaoke.id,
                region_id: seoul.id,
                status: 'ACTIVE',
                expired_at: new Date(1782518400000), // Placeholder active date
            }
        });
        console.log(`Updated Job: ${legacyRow.title}`);
    } else {
        await prisma.job.create({
            data: {
                legacy_id: legacyId,
                employer_id: employer.id,
                title: legacyRow.title,
                description: cleanedDescription,
                manager_name: legacyRow.manager_name,
                contact_value: legacyRow.contact_value,
                salary_info: legacyRow.salary_info || '협의',
                salary_type: (legacyRow.salary_type || 'NEGOTIABLE') as any,
                exposure_level: 'VVIP',
                category_id: karaoke.id,
                region_id: seoul.id,
                status: 'ACTIVE',
                expired_at: new Date(1782518400000),
                last_jumped_at: new Date()
            }
        });
        console.log(`Created Job: ${legacyRow.title}`);
    }
}

async function main() {
    // Migrate #2 and #3 as requested
    const targets = ['vmfpdls', 'ssunny'];
    for (const id of targets) {
        await migrateJob(id);
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
