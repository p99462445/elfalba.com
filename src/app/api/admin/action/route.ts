import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Admin check
        const isAdmin = user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com';

        if (!isAdmin) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        const body = await req.json()
        const { id, type, status } = body;

        if (type === 'POST_DELETE') {
            await prisma.post.delete({
                where: { id }
            })
            return NextResponse.json({ success: true, message: '게시글이 삭제되었습니다.' })
        }

        if (type === 'USER_STATUS') {
            await prisma.user.update({
                where: { id },
                data: { status }
            })
        } else if (type === 'EMPLOYER_VERIFICATION') {
            await prisma.employer.update({
                where: { id },
                data: { verification_status: status }
            })
            // If approved, update user role to EMPLOYER in DB and Supabase
            if (status === 'APPROVED') {
                const emp = await prisma.employer.findUnique({ where: { id } })
                if (emp) {
                    await prisma.user.update({
                        where: { id: emp.user_id },
                        data: { role: 'EMPLOYER' }
                    })

                    // Sync to Supabase metadata using service role client
                    const supabaseAdmin = createSupabaseClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    )
                    await supabaseAdmin.auth.admin.updateUserById(emp.user_id, {
                        user_metadata: { role: 'EMPLOYER' }
                    })
                }
            }
        } else if (type === 'JOB_STATUS') {
            await prisma.job.update({
                where: { id },
                data: { status }
            })
        } else if (type === 'PAYMENT_APPROVAL') {
            const payment = await prisma.payment.findUnique({
                where: { id },
                include: { product: true, job: true }
            })
            if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

            if (payment.status === 'APPROVED') {
                return NextResponse.json({ error: 'Already approved' }, { status: 400 })
            }

            await prisma.payment.update({
                where: { id },
                data: { status: 'APPROVED' }
            })

            const now = new Date()

            // 1. If product has jumps, determine where to add them
            if (payment.product?.jump_count) {
                if (payment.job_id) {
                    // Specific job package jumps
                    await prisma.job.update({
                        where: { id: payment.job_id },
                        data: {
                            remaining_auto_jumps: { increment: payment.product.jump_count },
                            auto_jump_interval_min: 144,
                            next_auto_jump_at: new Date(now.getTime() + 144 * 60000),
                            is_auto_jump_enabled: true,
                            status: 'ACTIVE' // Auto-activate if it was pending
                        }
                    })
                } else {
                    // Global jump coins for the employer
                    const employer = await prisma.employer.findFirst({
                        where: { user_id: payment.user_id }
                    })
                    if (employer) {
                        await prisma.employer.update({
                            where: { id: employer.id },
                            data: { jump_points: { increment: payment.product.jump_count } }
                        })
                    }
                }
            }

            // 2. Handling Exposure Level & Expiry (Cascading Waterfall Logic)
            if (payment.job_id && payment.product) {
                const data: any = {
                    status: 'ACTIVE',
                    updated_at: now
                }

                if (payment.product.duration_days) {
                    const existingJob = await prisma.job.findUnique({ where: { id: payment.job_id } })
                    
                    const duration = payment.product.duration_days;
                    
                    const getNewExpiry = (currentExpiry: Date | null) => {
                        let base = now;
                        if (currentExpiry && currentExpiry > now) {
                            base = currentExpiry;
                        }
                        const newDate = new Date(base);
                        newDate.setDate(newDate.getDate() + duration);
                        return newDate;
                    }

                    if (payment.product.product_type === 'VVIP_SLOT') {
                        data.vvip_expired_at = getNewExpiry(existingJob?.vvip_expired_at || existingJob?.expired_at || null);
                        data.vip_expired_at = getNewExpiry(existingJob?.vip_expired_at || existingJob?.expired_at || null);
                        data.normal_expired_at = getNewExpiry(existingJob?.normal_expired_at || existingJob?.expired_at || null);
                        data.exposure_level = 'VVIP'; // Legacy
                    } else if (payment.product.product_type === 'VIP_SLOT') {
                        data.vip_expired_at = getNewExpiry(existingJob?.vip_expired_at || existingJob?.expired_at || null);
                        data.normal_expired_at = getNewExpiry(existingJob?.normal_expired_at || existingJob?.expired_at || null);
                        data.exposure_level = 'VIP'; // Legacy
                    } else {
                        data.normal_expired_at = getNewExpiry(existingJob?.normal_expired_at || existingJob?.expired_at || null);
                        data.exposure_level = 'GENERAL'; // Legacy
                    }
                    
                    const dates = [data.vvip_expired_at, data.vip_expired_at, data.normal_expired_at].filter(Boolean);
                    if (dates.length > 0) {
                       data.expired_at = new Date(Math.max(...dates.map((d: any) => d.getTime())));
                    }
                }

                await prisma.job.update({
                    where: { id: payment.job_id },
                    data
                })
            }
        } else if (type === 'JOB_JUMP_EDIT') {
            const { jumpCount, intervalMin, isEnabled, vvip_expired_at, vip_expired_at, normal_expired_at } = body;
            const data: any = {}
            if (typeof jumpCount === 'number') data.remaining_auto_jumps = jumpCount
            if (typeof intervalMin === 'number') data.auto_jump_interval_min = intervalMin
            if (typeof isEnabled === 'boolean') data.is_auto_jump_enabled = isEnabled
            
            if (vvip_expired_at !== undefined) data.vvip_expired_at = vvip_expired_at ? new Date(vvip_expired_at) : null
            if (vip_expired_at !== undefined) data.vip_expired_at = vip_expired_at ? new Date(vip_expired_at) : null
            if (normal_expired_at !== undefined) data.normal_expired_at = normal_expired_at ? new Date(normal_expired_at) : null
            
            // Recalculate max legacy expired_at to maintain consistency across the app
            const datesToMax = [data.vvip_expired_at, data.vip_expired_at, data.normal_expired_at].filter(Boolean)
            if (datesToMax.length > 0) {
               data.expired_at = new Date(Math.max(...datesToMax.map((d: any) => (d as Date).getTime())));
            } else {
               data.expired_at = null;
            }

            await prisma.job.update({
                where: { id },
                data
            })

        } else if (type === 'EMPLOYER_JUMP_EDIT') {
            const { jumpPoints } = body;
            const emp = await prisma.employer.findFirst({
                where: { user_id: id }
            })
            if (emp) {
                await prisma.employer.update({
                    where: { id: emp.id },
                    data: { jump_points: jumpPoints }
                })
            } else {
                return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
            }

        } else if (type === 'JOB_DELETE') {
            await prisma.job.delete({
                where: { id }
            })
        } else if (type === 'JOB_EDIT_LOGO') {
            const { logo_url } = body;
            await prisma.job.update({
                where: { id },
                data: { logo_url }
            })
        } else if (type === 'EMPLOYER_DATA_EDIT') {
            const { business_name, owner_name, phone, business_number, jump_points } = body;
            await prisma.employer.update({
                where: { id },
                data: {
                    business_name,
                    owner_name,
                    phone,
                    business_number,
                    jump_points: (typeof jump_points === 'number' || typeof jump_points === 'string') ? parseInt(jump_points as any) : undefined
                }
            })
        } else {
            return NextResponse.json({ error: '잘못된 업데이터 타입입니다.' }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: '업데이트 성공' })

    } catch (error: any) {
        console.error('ADMIN ACTION ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
