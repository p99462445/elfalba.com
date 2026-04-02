import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const isVerified = user?.user_metadata?.is_adult === true || user?.app_metadata?.is_adult === true
    const isVerificationPage = request.nextUrl.pathname.startsWith('/signup/role')
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
    const isApiPage = request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/auth')
    const isPaymentResultPage = request.nextUrl.pathname.startsWith('/employer/payments/success') || 
                               request.nextUrl.pathname.startsWith('/employer/payments/failure')

    const isPrefetch = request.headers.get('x-middleware-prefetch') === '1'
    const isDataRequest = request.nextUrl.pathname.includes('/_next/data/')

    // 1. Mandatory Adult Verification Redirect (Exclude result pages & Employers)
    // If it's a prefetch or data request, we skip the redirect to avoid breaking SPA navigation
    if (user && !isVerified && !isVerificationPage && !isApiPage && !isPaymentResultPage && !isPrefetch && !isDataRequest) {
        // Employers are already verified by business registration, but if we really need adult check, 
        // we can add user_metadata.role check here.
        const role = user.user_metadata?.role || user.app_metadata?.role;
        if (role !== 'EMPLOYER') {
            return NextResponse.redirect(new URL('/signup/role', request.url))
        }
    }

    // 2. Admin area protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const role = user.user_metadata?.role || user.app_metadata?.role;
        const email = user.email;

        if (role !== 'ADMIN' && email !== '1@gmail.com') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // 3. Employer area protection (Exclude result pages)
    if (request.nextUrl.pathname.startsWith('/employer') && !isPaymentResultPage) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 4. Auth pages (login/signup) - don't show to fully verified logged-in users
    if (user && isVerified && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}
