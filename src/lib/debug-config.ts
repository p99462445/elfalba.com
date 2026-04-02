import prisma from './prisma';

async function main() {
  const config = await prisma.siteConfig.findFirst();
  console.log('--- SiteConfig Data ---');
  console.log(JSON.stringify(config, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
