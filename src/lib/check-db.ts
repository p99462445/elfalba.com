import prisma from './prisma';

async function main() {
    console.log(await prisma.jobCategory.findMany());
}

main().catch(console.error).finally(() => prisma.$disconnect());
