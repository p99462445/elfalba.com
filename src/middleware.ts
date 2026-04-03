import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Skip middleware for static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon.ico') ||
        pathname === '/inicis_pay_v2.html' ||
        // Skip static files, but DO NOT skip legacy .php, .htm, .html extensions so they can be redirected
        (/\.(.*)$/.test(pathname) && !pathname.endsWith('.php') && !pathname.endsWith('.htm') && !pathname.endsWith('.html'))
    ) {
        return NextResponse.next()
    }

    // 2. Redirect /regions to /방송모델 (SEO Root)
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
    if (decodedPathname === '/방송모델구인구직') {
        return NextResponse.rewrite(new URL('/resumes', request.url))
    }
    if (decodedPathname === '/방송모델구인구직/등록') {
        return NextResponse.rewrite(new URL('/resumes/register', request.url))
    }
    if (decodedPathname.startsWith('/방송모델구인구직/')) {
        const id = decodedPathname.split('/방송모델구인구직/')[1]
        return NextResponse.rewrite(new URL(`/resumes/${id}`, request.url))
    }
    if (decodedPathname === '/광고안내') {
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

    // 6. Smart Categorization for Legacy 1step/PHP SEO URLs (Catch-All Redirects)
    const lowerPath = pathname.toLowerCase()
    const searchParams = request.nextUrl.searchParams.toString().toLowerCase()
    
    // Ensure we don't accidentally redirect new valid paths like /admin or /employer
    if (!lowerPath.startsWith('/admin') && !lowerPath.startsWith('/employer')) {
        const isLegacyExtension = lowerPath.endsWith('.php') || lowerPath.endsWith('.htm') || lowerPath.endsWith('.html');
        // Catch old paths (avoid replacing new /jobs/ paths handled elsewhere)
        const isLegacyPath = lowerPath.includes('/board/') || lowerPath.includes('/bbs/') || (lowerPath.includes('/job/') && !lowerPath.includes('/jobs/'));

        if (isLegacyExtension || isLegacyPath) {
            // A) Community / Free Board / Notice patterns
            if (
                lowerPath.includes('free') || searchParams.includes('free') || 
                lowerPath.includes('community') || lowerPath.includes('bbs') || searchParams.includes('bbs') ||
                lowerPath.includes('board') || searchParams.includes('board')
            ) {
                return NextResponse.redirect(new URL('/community', request.url), 301)
            }
            
            // B) Job Listings / Job Details (No 1:1 mapping, send all to main job list)
            if (
                lowerPath.includes('job') || searchParams.includes('job') || 
                lowerPath.includes('guin') || lowerPath.includes('view') || searchParams.includes('view')
            ) {
                return NextResponse.redirect(new URL('/방송모델', request.url), 301)
            }
            
            // C) Default fallback for any other legacy paths -> Root homepage
            return NextResponse.redirect(new URL('/', request.url), 301)
        }
    }

    // Default: Continue to Next.js routing
    return await updateSession(request)
}

export const config = {
    matcher: ['/:path*'],
}
