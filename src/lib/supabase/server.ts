import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        console.warn('Running in Supabase Mock Mode (Shell Site)');
        const mockHandler: ProxyHandler<any> = {
            get: (target, prop) => {
                if (prop === 'auth') return {
                    getUser: async () => ({ data: { user: null }, error: null }),
                    getSession: async () => ({ data: { session: null }, error: null }),
                };
                if (prop === 'from') return () => ({
                    select: () => ({
                        eq: () => ({ order: () => ({ limit: () => ({ single: async () => ({ data: null, error: null }), then: (cb: any) => cb({ data: [], error: null }) }) }) }),
                        order: () => ({ then: (cb: any) => cb({ data: [], error: null }) }),
                        then: (cb: any) => cb({ data: [], error: null }),
                    }),
                });
                return (...args: any[]) => ({ then: (cb: any) => cb({ data: null, error: null }) });
            }
        };
        return new Proxy({}, mockHandler) as any;
    }

    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch (error) {
                    }
                },
            },
        }
    )
}
