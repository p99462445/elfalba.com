import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resetUser(username: string) {
  console.log(`--- Resetting User: ${username} ---`)
  const email = `${username.toLowerCase()}@badalba.com`

  try {
    // 1. Delete from Supabase Auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const targetAuthUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (targetAuthUser) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetAuthUser.id)
      if (deleteError) {
        console.error('Failed to delete Auth user:', deleteError.message)
      } else {
        console.log(`Successfully deleted Auth user: ${targetAuthUser.id}`)
      }
    } else {
      console.log('No Auth user found for this email.')
    }

    // 2. Update User table
    const userUpdate = await prisma.user.updateMany({
      where: {
        OR: [
          { old_id: username },
          { email: email }
        ]
      },
      data: {
        is_activated: false
      }
    })
    console.log(`Updated ${userUpdate.count} User records (is_activated = false).`)

    // 3. Update LegacyMember table
    const legacyUpdate = await prisma.legacyMember.updateMany({
      where: {
        username: username
      },
      data: {
        is_migrated: false
      }
    })
    console.log(`Updated ${legacyUpdate.count} LegacyMember records (is_migrated = false).`)

    console.log('--- Reset Complete! ---')

  } catch (error) {
    console.error('Reset failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get username from command line argument
const argId = process.argv[2]
if (!argId) {
  console.error('Please provide a username: npx tsx scripts/reset-user-migration.ts USERNAME')
  process.exit(1)
}

resetUser(argId)
