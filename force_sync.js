const { execSync } = require('child_process');
process.env.DATABASE_URL = "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
try {
    console.log('Starting DB Push via Direct URL...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('DB Push Successful. Running Generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Process Completed.');
} catch (e) {
    console.error('FAILED:', e.message);
    process.exit(1);
}
