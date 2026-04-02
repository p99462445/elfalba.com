require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`🚀 Starting database backup to: ${backupDir}`);

    try {
        // List of models to backup
        const models = [
            'user',
            'employer',
            'job',
            'jobCategory',
            'region',
            'payment',
            'notice',
            'siteConfig'
        ];

        for (const model of models) {
            console.log(`📦 Backing up ${model}...`);
            const data = await prisma[model].findMany();
            fs.writeFileSync(
                path.join(backupDir, `${model}.json`),
                JSON.stringify(data, null, 2)
            );
        }

        console.log('\n✅ Backup completed successfully!');
        console.log(`📍 Location: ${backupDir}`);

        // Create a manifest file
        const manifest = {
            timestamp,
            count: models.length,
            models
        };
        fs.writeFileSync(
            path.join(backupDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

    } catch (error) {
        console.error('❌ Backup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
