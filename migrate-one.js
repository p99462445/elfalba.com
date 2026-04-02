const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';
const cleanConnectionString = connectionString.trim().replace(/[\r\n]/g, '');

const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const legacyId = "8981";
    const userId = "hun268";
    const email = `${userId}@badalba.com`;

    try {
        // 1. Create User & Employer if not exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    old_id: userId,
                    role: 'EMPLOYER',
                    verified_at: new Date(),
                    name: '이사 사장님',
                    nickname: userId,
                    is_adult: true,
                    terms_agreed: true,
                    privacy_agreed: true
                }
            });
            console.log('User created:', user.id);
        }

        let employer = await prisma.employer.findUnique({ where: { user_id: user.id } });
        if (!employer) {
            employer = await prisma.employer.create({
                data: {
                    user_id: user.id,
                    business_name: 'Cute',
                    owner_name: '담당자',
                    phone: '010-3345-2110',
                    address: '서울 강남구 신림동',
                    verification_status: 'APPROVED'
                }
            });
            console.log('Employer created:', employer.id);
        }

        // 2. Create Job
        const job = await prisma.job.create({
            data: {
                employer_id: employer.id,
                category_id: 2, // 노래주점
                region_id: 162, // 서울
                title: '신림/신대방 지역에서 잘 나가는 Cute 입니다.',
                business_name: 'Cute',
                description: `[ 업소명 ] 
안녕하세요~ 신림/신대방 지역에서 잘 나가는 Cute 입니다. 
일단 전번부터 입력하세요~ 010 3345 2110 

★ 금액 ★ (페이) 
가장 중요한 것이지요.^^ 
일단 출근하시면 기본 테이블 8개 / 한시간에 60,000 

★ 수금은 ★ 
------------------당일! 100%로 당일------------------- 
그날 본 페이는 바로 드려요`,
                salary_amount: 60000,
                salary_type: 'HOURLY',
                exposure_level: 'VVIP',
                manager_name: '담당자',
                contact_value: '010-3345-2110',
                expired_at: new Date('2026-04-18'),
                status: 'ACTIVE'
            }
        });

        console.log('Job migrated successfully! ID:', job.id);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
