import prisma from './prisma';

async function main() {
    try {
        const adminEmail = '1@gmail.com';
        const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!adminUser) {
            console.error(`Admin user ${adminEmail} not found. Aborting cleanup to prevent total data loss.`);
            return;
        }

        const adminId = adminUser.id;
        console.log(`Found admin user: ${adminEmail} (ID: ${adminId})`);

        console.log('Cleaning up related data in dependency order...');

        // Target users to delete
        const targetUsers = await prisma.user.findMany({
            where: { id: { not: adminId } },
            select: { id: true }
        });
        const targetUserIds = targetUsers.map(u => u.id);

        // Target employers to delete
        const targetEmployers = await prisma.employer.findMany({
            where: { user_id: { in: targetUserIds } },
            select: { id: true }
        });
        const targetEmployerIds = targetEmployers.map(e => e.id);

        // Target jobs to delete
        const targetJobs = await prisma.job.findMany({
            where: { employer_id: { in: targetEmployerIds } },
            select: { id: true }
        });
        const targetJobIds = targetJobs.map(j => j.id);

        // 1. Delete records pointing to target JOBS
        console.log(`Deleting records for ${targetJobIds.length} candidate jobs...`);
        await prisma.jobApplication.deleteMany({ where: { job_id: { in: targetJobIds } } });
        await prisma.payment.deleteMany({ where: { job_id: { in: targetJobIds } } });
        await prisma.bookmark.deleteMany({ where: { job_id: { in: targetJobIds } } });
        await prisma.autoJump.deleteMany({ where: { job_id: { in: targetJobIds } } });
        // JobImage and JobRegion should cascade, but let's be safe
        await prisma.jobImage.deleteMany({ where: { job_id: { in: targetJobIds } } });
        await prisma.jobRegion.deleteMany({ where: { job_id: { in: targetJobIds } } });

        // 2. Delete remaining records for target USERS
        console.log(`Deleting social/notification records for ${targetUserIds.length} users...`);
        await prisma.notification.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.bookmark.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.postLike.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.comment.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.post.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.supportQAComment.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.supportQA.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.jobApplication.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.payment.deleteMany({ where: { user_id: { in: targetUserIds } } });
        await prisma.message.deleteMany({ where: { sender_id: { in: targetUserIds } } });
        await prisma.chatRoom.deleteMany({ where: { OR: [{ user1_id: { in: targetUserIds } }, { user2_id: { in: targetUserIds } }] } });

        // 3. Delete JOBS
        console.log('Deleting target jobs...');
        await prisma.job.deleteMany({ where: { id: { in: targetJobIds } } });

        // 4. Delete EMPLOYERS
        console.log('Deleting target employers...');
        await prisma.employer.deleteMany({ where: { id: { in: targetEmployerIds } } });

        // 5. Finally delete USERS
        console.log('Deleting target users...');
        const deleted = await prisma.user.deleteMany({
            where: { id: { in: targetUserIds } }
        });

        console.log(`Cleanup complete. Deleted ${deleted.count} users.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
