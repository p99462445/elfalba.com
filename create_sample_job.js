require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    let employer = await prisma.employer.findFirst();
    let category = await prisma.jobCategory.findFirst();
    let region = await prisma.region.findFirst({ where: { parent_id: { not: null } } });

    if (!employer) {
        console.log('No employer found. Creating a dummy one...');
        const user = await prisma.user.upsert({
            where: { email: 'employer@sample.com' },
            update: {},
            create: {
                email: 'employer@sample.com',
                nickname: '강남아트',
                role: 'EMPLOYER'
            }
        });

        employer = await prisma.employer.create({
            data: {
                user_id: user.id,
                business_name: '강남 아트 하우스',
                owner_name: '김사장',
                address: '서울시 강남구 테헤란로 123',
                verification_status: 'APPROVED'
            }
        });
    }

    if (!category || !region) {
        console.log('Category or Region missing.');
        return;
    }

    const job = await prisma.job.create({
        data: {
            title: '[실속] 앨프알바 강남점 - 신규오픈 멤버 모집',
            description: '악녀알바에서 함께 꿈을 키워나갈 열정적인 분들을 모집합니다. 강남권 최고의 시설과 대우를 약속드립니다. 초보환영, 경력자우대.',
            qualifications: '20세 이상 성인 여성 (초보 가능)',
            salary_type: 'DAILY',
            salary_amount: 450000,
            salary_info: '일급 45만원 + @ (당일정산 보장)',
            working_hours: '20:00 ~ 03:00 (협의 가능)',
            contact_value: '010-1234-5678',
            employer_id: employer.id,
            category_id: category.id,
            region_id: region.id,
            status: 'ACTIVE',
            last_jumped_at: new Date()
        }
    });

    console.log('Sample Job Created:', job.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
