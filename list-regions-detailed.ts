import prisma from './src/lib/prisma';

async function main() {
    const all = await prisma.region.findMany({
        orderBy: { id: 'asc' },
        include: { parent: true }
    });
    all.forEach(r => {
        console.log(`${r.id} | ${r.parent?.name || 'ROOT'} | ${r.name} | ${r.slug}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
