import { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import FooterWrapper from '@/components/layout/FooterWrapper'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import PageTransition from '@/components/layout/PageTransition'
import { AuthProvider } from '@/context/AuthContext'
import AuthModal from '@/components/layout/AuthModal'
import VerificationModal from '@/components/layout/VerificationModal'
import Providers from '@/components/Providers'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

const baseMetadata: Metadata = {
    referrer: 'no-referrer-when-downgrade',
    title: {
        default: '엘프알바 - 모델, 연기자, 방송 촬영 구인구직 No.1',
        template: '%s | 엘프알바',
    },
    description: '모델, 연기자, 방송 촬영 전용 구인구직 플랫폼 엘프알바. 전국 실시간 채용정보와 안전하게 검증된 업체만 안내합니다.',
    keywords: ['엘프알바', '모델구인', '배우구인', '방송알바', '촬영모델', '구인구직'],
    authors: [{ name: 'Elfalba Team' }],
    creator: 'Elfalba Team',
    publisher: 'Elfalba Team',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://elfalba.com'),
    openGraph: {
        type: 'website',
        locale: 'ko_KR',
        url: 'https://elfalba.com',
        siteName: '엘프알바',
        title: '엘프알바 - 모델, 배우, 방송 구인구직',
        description: '모델, 연기자, 방송 촬영 전용 구인구직 플랫폼 엘프알바. 전국 실시간 채용정보와 안전하게 검증된 업체만 안내합니다.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: '엘프알바 - 모델/배우 채용정보 No.1',
            },
        ],
    },
}

export async function generateMetadata(): Promise<Metadata> {
    const mainUrl = process.env.NEXT_PUBLIC_MAIN_URL || 'https://elfalba.com';
    try {
        return {
            ...baseMetadata,
            robots: {
                index: false,
                follow: false,
                nocache: true,
                googleBot: {
                    index: false,
                    follow: false,
                },
            },
            alternates: {
                canonical: mainUrl,
            },
        };
    } catch (e) {
        return baseMetadata;
    }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <head>
                <link rel="dns-prefetch" href="//fonts.googleapis.com" />
                <link rel="dns-prefetch" href="//t1.daumcdn.net" />

                {process.env.NEXT_PUBLIC_GA_ID && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                            strategy="afterInteractive"
                        />
                        <Script id="google-analytics" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                            `}
                        </Script>
                    </>
                )}
                {/* PortOne v2 SDK */}
                <Script 
                    src="https://cdn.portone.io/v2/browser-sdk.js" 
                    strategy="afterInteractive"
                />
            </head>
            <body className={`${inter.className} antialiased selection:bg-amber-100 selection:text-amber-600 bg-white dark:bg-dark-bg min-h-screen flex flex-col text-gray-900 dark:text-gray-100`}>
                <Providers>
                    <AuthProvider>
                        <PageTransition />
                        <AuthModal />
                        <VerificationModal />
                        <Header />
                        <main className="flex-1 pb-14 md:pb-0 flex flex-col">
                            {children}
                        </main>
                        <FooterWrapper />
                        <MobileBottomNav />
                    </AuthProvider>
                    
                </Providers>
            </body>
        </html>
    )
}
