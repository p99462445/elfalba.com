import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (error) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error_description=${encodeURIComponent(errorDescription || error)}`)
    }

    if (code) {
        const supabase = await createClient()
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError && data.user) {
            const user = data.user
            const cookieStore = await import('next/headers').then(h => h.cookies());
            const cookies = await cookieStore;
            const verificationToken = cookies.get('sb-verification-token')?.value;

            // Check if user already exists in Prisma
            let existingUser = await prisma.user.findUnique({
                where: { id: user.id }
            })

            // IF NEW USER + HAS VERIFICATION TOKEN: Create verified user immediately!
            if (!existingUser && verificationToken) {
                try {
                    const tokenRecord = await prisma.verificationToken.findUnique({
                        where: { token: verificationToken }
                    })

                    if (tokenRecord && new Date() < new Date(tokenRecord.expires_at)) {
                        const verifiedData = tokenRecord.data as any;

                        // Create the verified user in Prisma
                        existingUser = await prisma.user.create({
                            data: {
                                id: user.id,
                                email: user.email ?? '',
                                role: 'USER', // Default or could refine
                                name: verifiedData.name,
                                nickname: verifiedData.name,
                                real_name: verifiedData.name,
                                birthdate: verifiedData.birthDate,
                                gender: verifiedData.gender,
                                ci: verifiedData.ci,
                                phone: verifiedData.phone,
                                is_adult: true,
                                verified_at: new Date(),
                            }
                        })

                        // Delete token after use
                        await prisma.verificationToken.delete({ where: { token: verificationToken } })
                        // Delete cookie
                        cookies.delete('sb-verification-token');
                    }
                } catch (err) {
                    console.error('Error during auto-signup from token:', err);
                }
            }

            // Sync/Verify status
            if (existingUser?.is_adult) {
                await supabase.auth.updateUser({
                    data: { is_adult: true, role: existingUser.role }
                })
            }



            // If everything is perfect, redirect to home/employer
            if (existingUser?.role === 'EMPLOYER') {
                return NextResponse.redirect(`${origin}/employer`)
            }
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            // Pass the actual error message for debugging
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error_description=${encodeURIComponent(exchangeError?.message || 'Unknown authentication error')}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
