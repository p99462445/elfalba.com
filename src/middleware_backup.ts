import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Skip middleware for static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon.ico') ||
        /\.(.*)$/.test(pathname)
    ) {
        return NextResponse.next()
    }

    // 2. Redirect /regions to /방송모델 (SEO Root)
    // Permanent redirect (301) for search engines
    if (pathname === '/regions') {
        return NextResponse.redirect(new URL('/방송모델', request.url), 301)
    }

    const decodedPathname = decodeURIComponent(pathname)

    // 3. Korean SEO Navigation Aliases (Internal Rewrites)
    if (decodedPathname === '/방송모델-커뮤니티') {
        return NextResponse.rewrite(new URL('/community', request.url))
    }
    if (decodedPathname === '/방송모델-고객센터') {
        return NextResponse.rewrite(new URL('/support', request.url))
    }
    if (decodedPathname === '/고소득알바-광고안내') {
        return NextResponse.rewrite(new URL('/ad-info', request.url))
    }

    // 4. Job Detail Rewrite (/구인/[slug] -> /job-detail/[slug])
    if (decodedPathname.startsWith('/구인/')) {
        const jobSlug = decodedPathname.split('/구인/')[1] || ''
        return NextResponse.rewrite(new URL(`/job-detail/${jobSlug}`, request.url))
    }

    // 5. Legacy UUID Redirects
    const legacyDetailRegex = /^\/jobs\/[^\/]+\/[^\/]+\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    const match = pathname.match(legacyDetailRegex)
    if (match) {
        const jobId = match[1]
        return NextResponse.redirect(new URL(`/구인/채용공고-${jobId}`, request.url), 301)
    }

    // Default: Continue to Next.js routing (will hit [...] and other pages directly)
    return await updateSession(request)
}

export const config = {
    matcher: ['/:path*'],
}
