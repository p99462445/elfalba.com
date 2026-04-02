require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            where: { email: 'elf@elf.com' },
            include: { employer: true }
        });

        if (!user) {
            console.log("USER_NOT_FOUND");
            return;
        }

        // Filter sensitive or circular data
        const cleanUser = {
            email: user.email,
            old_id: user.old_id,
            contact_email: user.contact_email,
            name: user.name,
            nickname: user.nickname,
            phone: user.phone,
            role: user.role,
            status: user.status,
            is_adult: user.is_adult,
            gender: user.gender,
            birthdate: user.birthdate,
            employer: user.employer ? {
                business_name: user.employer.business_name,
                business_number: user.employer.business_number,
                address: user.employer.address,
                manager_phone: user.employer.phone
            } : null
        };

        console.log(JSON.stringify(cleanUser, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
