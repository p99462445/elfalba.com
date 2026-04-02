import prisma from './prisma';

async function check() {
  try {
    const count = await prisma.smsLog.count();
    console.log('SmsLog table exists. Current count:', count);
  } catch (err) {
    console.error('SmsLog table check failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
