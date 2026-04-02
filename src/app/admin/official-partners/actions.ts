'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function searchJobByNo(jobNo: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== 'ADMIN') return { success: false, error: 'Forbidden' }

    const job = await prisma.job.findUnique({
        where: { job_no: jobNo },
        select: { 
            id: true, 
            job_no: true, 
            title: true, 
            business_name: true, 
            status: true,
            vvip_expired_at: true,
            vip_expired_at: true,
            normal_expired_at: true
        }
    })

    if (!job) return { success: false, error: '공고를 찾을 수 없습니다.' }
    return { 
        success: true, 
        job: {
            ...job,
            vvip_expired_at: job.vvip_expired_at?.toISOString() || null,
            vip_expired_at: job.vip_expired_at?.toISOString() || null,
            normal_expired_at: job.normal_expired_at?.toISOString() || null,
        } 
    }
}

export async function setOfficialPartner(jobId: string, days: number, specificDate?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== 'ADMIN') return { success: false, error: 'Forbidden' }

    let expiresAt: Date;
    if (specificDate) {
        expiresAt = new Date(specificDate);
    } else {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + days)
    }

    await prisma.job.update({
        where: { id: jobId },
        data: {
            is_official_partner: true,
            official_partner_expires_at: expiresAt
        }
    })

    revalidatePath('/')
    revalidatePath('/admin/official-partners')

    return { success: true }
}

export async function removeOfficialPartner(jobId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== 'ADMIN') return { success: false, error: 'Forbidden' }

    await prisma.job.update({
        where: { id: jobId },
        data: {
            is_official_partner: false,
            official_partner_expires_at: null
        }
    })

    revalidatePath('/')
    revalidatePath('/admin/official-partners')

    return { success: true }
}
