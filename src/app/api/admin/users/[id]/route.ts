import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user: adminUser } } = await supabase.auth.getUser()

        // Admin check
        const isAdmin = adminUser?.user_metadata?.role === 'ADMIN' || adminUser?.email === '1@gmail.com';
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                employer: true,
                _count: {
                    select: {
                        posts: true,
                        comments: true,
                        applications: true,
                        payments: true
                    }
                }
            }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json(user)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user: adminUser } } = await supabase.auth.getUser()

        const isAdmin = adminUser?.user_metadata?.role === 'ADMIN' || adminUser?.email === '1@gmail.com'
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await req.json()
        const { name, phone, nickname, role, password } = body

        // Build update payload only with provided fields
        const updateData: Record<string, any> = {}
        if (name !== undefined) updateData.name = name
        if (phone !== undefined) updateData.phone = phone
        if (nickname !== undefined) updateData.nickname = nickname
        if (role !== undefined) updateData.role = role

        // Update Prisma
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData as any
        })

        // If role changed to EMPLOYER, create employer record if not exists
        if (role === 'EMPLOYER') {
            await prisma.employer.upsert({
                where: { user_id: id },
                create: {
                    user_id: id,
                    business_name: updatedUser.real_name || updatedUser.nickname || '미등록',
                    verification_status: 'PENDING',
                },
                update: {} // do nothing if record already exists
            })
        }

        // Handle sensitive Auth updates (role and password)
        if (role || password) {
            try {
                const { createClient: createAdminClient } = await import('@supabase/supabase-js')
                const adminSupabase = createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )
                
                const authUpdate: any = {}
                if (role) authUpdate.user_metadata = { role }
                if (password) authUpdate.password = password

                const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, authUpdate)
                if (authError) throw authError
            } catch (err) {
                console.error('Supabase Auth sync failed:', err)
            }
        }

        return NextResponse.json(updatedUser)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
