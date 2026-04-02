import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '광고 안내 및 상품 | 엘프알바',
    description: '최적의 인재를 만나는 빠르고 확실한 방법. 엘프알바의 프리미엄 상단 노출 상품과 합리적인 비용 안내.',
    alternates: {
        canonical: 'https://elfalba.com/advertise'
    }
}

export default function AdvertiseLayout({ children }: { children: React.ReactNode }) {
    return children
}
