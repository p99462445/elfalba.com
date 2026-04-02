const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB USER INFO: elf@elf.com ---');
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'elf@elf.com' },
            include: { employer: true }
        });

        if (!user) {
            console.log('User elf@elf.com not found in the DB.');
        } else {
            console.log('----------------------------');
            console.log(`이메일: ${user.email}`);
            console.log(`닉네임: ${user.nickname}`);
            console.log(`권한: ${user.role}`);
            console.log(`전화번호: ${user.phone}`);
            console.log(`성별: ${user.gender}`);
            console.log(`가입일: ${user.created_at}`);
            if (user.employer) {
                console.log(`상호명: ${user.employer.business_name}`);
                console.log(`사업자 상태: ${user.employer.verification_status}`);
            }
            console.log('----------------------------');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
