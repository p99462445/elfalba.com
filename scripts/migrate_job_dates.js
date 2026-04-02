require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting job expiration dates migration...');
  
  const jobs = await prisma.job.findMany({
    where: {
      expired_at: { not: null }
    }
  });

  console.log(`Found ${jobs.length} jobs with expired_at set.`);
  
  let migratedCount = 0;

  for (const job of jobs) {
    if (job.vvip_expired_at || job.vip_expired_at || job.normal_expired_at) {
      continue; // already migrated
    }

    const updates = {};
    const e = job.expired_at;

    if (job.exposure_level === 'VVIP') {
      updates.vvip_expired_at = e;
      updates.vip_expired_at = e;
      updates.normal_expired_at = e;
    } else if (job.exposure_level === 'VIP') {
        updates.vip_expired_at = e;
        updates.normal_expired_at = e;
    } else {
        updates.normal_expired_at = e;
    }

    try {
        await prisma.job.update({
          where: { id: job.id },
          data: updates
        });
        migratedCount++;
        if (migratedCount % 100 === 0) {
            console.log(`Migrated ${migratedCount} jobs...`);
        }
    } catch (err) {
        console.error(`Failed to update job ${job.id}:`, err);
    }
  }

  console.log(`Migration complete! Successfully updated ${migratedCount} jobs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
