import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resetMigration(username: string) {
  console.log(`🚀 Resetting migration for ${username}...`)

  try {
    const email = `${username}@badalba.com`

    // 1. Delete from Prisma User table
    // This will cascade delete related data if schema is set, but let's be safe
    const user = await prisma.user.findFirst({
      where: { old_id: username }
    })

    if (user) {
      console.log(`- Found Prisma user: ${user.id}. Deleting...`)
      
      // Delete employer if exists
      await prisma.employer.deleteMany({ where: { user_id: user.id } })
      
      // Delete user
      await prisma.user.delete({ where: { id: user.id } })
      console.log(`- Deleted Prisma user.`)
    } else {
      console.log(`- No Prisma user found for ${username}.`)
    }

    // 2. Delete from Supabase Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const authUser = users.find(u => u.email === email)
    if (authUser) {
      console.log(`- Found Auth user: ${authUser.id}. Deleting...`)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      if (deleteError) throw deleteError
      console.log(`- Deleted Auth user.`)
    } else {
      console.log(`- No Auth user found for ${email}.`)
    }

    // 3. Mark as not migrated in LegacyMember
    const legacy = await prisma.legacyMember.updateMany({
      where: { username: username },
      data: { is_migrated: false }
    })
    console.log(`- Updated ${legacy.count} legacy records to is_migrated = false.`)

    console.log(`✅ Reset complete for ${username}!`)
  } catch (error) {
    console.error(`❌ Reset failed:`, error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get ID from command line
const targetId = process.argv[2]
if (!targetId) {
  console.error("Please provide a username: npx tsx reset-migration.ts <username>")
  process.exit(1)
}

resetMigration(targetId)
