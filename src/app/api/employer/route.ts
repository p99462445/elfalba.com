import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { businessNumber, businessName, representativeName, address, detailedAddress, invoiceType, businessCertUrl } = body

        console.log("REGISTERING EMPLOYER:", { userId: user.id, businessName, businessNumber })

        if (!businessName) {
            return NextResponse.json({ error: '상호명(업소명)은 필수입니다.' }, { status: 400 })
        }

        // 1. Ensure Prisma User exists (Sync Supabase Auth with Prisma)
        // Handle case where an old Prisma user exists with the same email but different ID
        const existingByEmail = await prisma.user.findUnique({ where: { email: user.email! } });
        if (existingByEmail && existingByEmail.id !== user.id) {
            console.log("Found conflicting user ID, renaming old email:", existingByEmail.id);
            await prisma.user.update({
                where: { id: existingByEmail.id },
                data: { email: `orphaned_${Date.now()}_${existingByEmail.email}` }
            });
        }

        const userUpdate = await prisma.user.upsert({
            where: { id: user.id },
            update: { role: 'EMPLOYER' },
            create: {
                id: user.id,
                email: user.email!,
                role: 'EMPLOYER',
            }
        })
        console.log("USER UPSERT SUCCESS:", userUpdate.id)

        // 1.5 Update Supabase Session Metadata so Middleware won't redirect them
        const { error: authErr } = await supabase.auth.updateUser({
            data: { role: 'EMPLOYER' }
        })
        if (authErr) {
            console.error("Failed to update supabase auth metadata role:", authErr)
            // We ignore this error to not break the flow, but it's noted.
        }

        // 2. Create or Update Employer Profile
        const employer = await prisma.employer.upsert({
            where: { user_id: user.id },
            update: {
                business_number: businessNumber,
                business_name: businessName,
                owner_name: representativeName,
                address: `${address} ${detailedAddress}`,
                business_license_url: businessCertUrl || null,
            },
            create: {
                user_id: user.id,
                business_number: businessNumber,
                business_name: businessName,
                owner_name: representativeName,
                address: `${address} ${detailedAddress}`,
                business_license_url: businessCertUrl || null,
                verification_status: 'APPROVED', // For MVP, auto-approve
            }
        })
        console.log("EMPLOYER UPSERT SUCCESS:", employer.id)

        return NextResponse.json({ message: 'Employer registered successfully', data: employer })

    } catch (error: any) {
        console.error("EMPLOYER POST ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
