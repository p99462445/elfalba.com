import prisma from './src/lib/prisma';

async function main() {
    const all = await prisma.region.findMany({ orderBy: { id: 'asc' } });
    all.forEach(r => console.log(r.slug + ' | ' + r.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
