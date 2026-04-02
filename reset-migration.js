const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetMigration(username) {
  console.log(`🚀 Resetting migration for ${username}...`)

  try {
    const email = `${username}@badalba.com`

    // 1. Delete from Prisma User table
    const user = await prisma.user.findFirst({
      where: { old_id: username }
    })

    if (user) {
      console.log(`- Found Prisma user: ${user.id}. Deleting...`)
      await prisma.employer.deleteMany({ where: { user_id: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }

    // 2. Delete from Supabase Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const authUser = users.find(u => u.email === email)
    if (authUser) {
      console.log(`- Found Auth user: ${authUser.id}. Deleting...`)
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
    }

    // 3. Mark as not migrated in LegacyMember
    await prisma.legacyMember.updateMany({
      where: { username: username },
      data: { is_migrated: false }
    })

    console.log(`✅ Reset complete for ${username}!`)
  } catch (error) {
    console.error(`❌ Reset failed:`, error)
  } finally {
    await prisma.$disconnect()
  }
}

const targetId = process.argv[2]
if (!targetId) {
  process.exit(1)
}

resetMigration(targetId)
