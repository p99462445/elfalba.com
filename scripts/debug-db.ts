import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USER DATA DEBUG ---');
    try {
        const users = await prisma.user.findMany({
            take: 5, // 최근 가입자나 상위 5명만 확인
        });

        if (users.length === 0) {
            console.log('No users found in the DB.');
        } else {
            console.log('Found users:', users.map(u => ({
                id: u.id,
                email: u.email,
                nickname: u.nickname,
                phone: u.phone,
                role: u.role,
                gender: u.gender
            })));
        }
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
