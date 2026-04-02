import React from 'react'
import prisma from '@/lib/prisma'
import PartnersClient from './PartnersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OfficialPartnersPage() {
    const partnersRaw = await prisma.job.findMany({
        where: { is_official_partner: true, official_partner_expires_at: { gt: new Date() } },
        include: { 
            employer: { include: { user: true } }, 
            category: true, 
            region: true, 
            images: true 
        },
        orderBy: { official_partner_expires_at: 'asc' }
    })

    const partners = partnersRaw.map(p => ({
        ...p,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
        official_partner_expires_at: p.official_partner_expires_at?.toISOString(),
        vvip_expired_at: p.vvip_expired_at?.toISOString(),
        vip_expired_at: p.vip_expired_at?.toISOString(),
        normal_expired_at: p.normal_expired_at?.toISOString(),
    }))

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                👑 공식 파트너 관리
            </h1>
            <p className="text-sm text-gray-500 font-bold mb-8">
                기존 채용공고 결제 시스템과 분리된 완전히 독자적인 시스템입니다. 여기에 등록된 최우수 공고는 메인 페이지 가장 상단에 고정되며 최대 4개가 접속 시마다 랜덤 롤링 표시됩니다.
            </p>
            
            <PartnersClient initialPartners={partners} />
        </div>
    )
}
