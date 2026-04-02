require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'kkhhssm2501@naver.com';
    const old_id = 'kkhhss2501';
    const businessName = '샘플업소_1';
    const phone = '010-2512-6784';
    const birthdate = '2002-11-08';
    const businessNumber = '5397400533';

    console.log(`Inserting sample user: ${email}...`);

    try {
        // 1. Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            console.log('User already exists. Deleting to re-insert fresh sample...');
            await prisma.user.delete({ where: { id: existing.id } });
        }

        // 2. Insert User and Employer together
        const newUser = await prisma.user.create({
            data: {
                email,
                old_id,
                phone,
                birthdate,
                role: 'EMPLOYER',
                status: 'ACTIVE',
                is_adult: true,
                nickname: old_id, // Default nickname as ID
                employer: {
                    create: {
                        business_name: businessName,
                        business_number: businessNumber,
                        phone: phone,
                        address: '샘플 주소 (서울시 강남구)',
                        owner_name: '샘플대표'
                    }
                }
            },
            include: {
                employer: true
            }
        });

        console.log('Successfully inserted sample user!');
        console.log(JSON.stringify(newUser, null, 2));

    } catch (error) {
        console.error('Error inserting sample user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
