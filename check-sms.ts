import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.smsLog.findMany({
    take: 10,
    orderBy: { created_at: 'desc' }
  });

  console.log('--- Last 10 SMS Logs ---');
  logs.forEach(log => {
      console.log(`[${log.created_at}] To: ${log.to}, Status: ${log.status}, Type: ${log.type}`);
      if (log.error_message) console.log(`  Error: ${log.error_message}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
