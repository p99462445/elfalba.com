import { createClient } from '@/lib/supabase/server'
import SupportClient from './SupportClient'
import { MOCK_NOTICES } from '@/lib/mockData'

import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '고객센터 & 공지사항 | 엘프알바',
    description: '엘프알바 고객센터입니다. 공지사항, 자주 묻는 질문(FAQ) 및 1:1 이용 문의를 빠르고 친절하게 해결해드립니다.',
    alternates: {
        canonical: 'https://elfalba.com/support'
    }
}

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const params = await searchParams
    const activeTab = params.tab || 'notice'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const notices = MOCK_NOTICES

    return (
        <SupportClient
            notices={notices}
            initialTab={activeTab}
            isAdmin={false}
            currentUserId={user?.id || null}
        />
    )
}
