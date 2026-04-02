require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany();
    const regions = await prisma.region.findMany({ where: { parent_id: { not: null } }, take: 5 });
    const employers = await prisma.employer.findMany({ take: 3 });

    console.log('Categories:', categories.map(c => ({ id: c.id, name: c.name })));
    console.log('Regions:', regions.map(r => ({ id: r.id, name: r.name })));
    console.log('Employers:', employers.map(e => ({ id: e.id, name: e.business_name })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
