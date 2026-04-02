const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'cds5233' } },
    include: { employer: true }
  });
  
  console.log('--- User & Employer Data ---');
  console.log(JSON.stringify(users, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  
  await prisma.$disconnect();
}

check().catch(console.error);
