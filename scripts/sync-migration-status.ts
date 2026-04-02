import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Migration Status Sync Start ---')

  // 1. Get all users who have an old_id (corporate/pre-migrated users)
  const users = await prisma.user.findMany({
    where: {
      old_id: { not: null }
    },
    select: {
      id: true,
      old_id: true,
      email: true
    }
  })

  console.log(`Found ${users.length} users with old_id.`)

  let updatedCount = 0

  for (const user of users) {
    if (!user.old_id) continue

    // 2. Mark as migrated in LegacyMember table
    const legacyUpdate = await prisma.legacyMember.updateMany({
      where: {
        username: user.old_id,
        is_migrated: false
      },
      data: {
        is_migrated: true
      }
    })

    if (legacyUpdate.count > 0) {
      updatedCount += legacyUpdate.count
      // 3. (Optional) If we want to mark them as NOT activated yet (since they haven't logged in with the new flow)
      // Any pre-migrated user should have is_activated = false by default (Prisma schema default)
    }
  }

  console.log(`Updated ${updatedCount} legacy members to 'is_migrated = true'.`)
  console.log('--- Migration Status Sync Finished ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
