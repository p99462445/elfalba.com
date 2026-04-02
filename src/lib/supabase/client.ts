import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function createClient() {
    if (client) return client

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        console.warn('Running in Supabase Mock Mode (Shell Site)');
        
        // Robust mock client to prevent build/runtime errors
        const mockHandler: ProxyHandler<any> = {
            get: (target, prop) => {
                if (prop === 'auth') return {
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                    getUser: async () => ({ data: { user: null }, error: null }),
                    getSession: async () => ({ data: { session: null }, error: null }),
                    signOut: async () => ({ error: null }),
                };
                if (prop === 'from') return () => ({
                    select: () => ({
                        eq: () => ({ order: () => ({ limit: () => ({ single: async () => ({ data: null, error: null }), then: (cb: any) => cb({ data: [], error: null }) }) }) }),
                        order: () => ({ limit: () => ({ then: (cb: any) => cb({ data: [], error: null }) }) }),
                        then: (cb: any) => cb({ data: [], error: null }),
                    }),
                    insert: async () => ({ error: null }),
                    update: async () => ({ error: null }),
                    delete: async () => ({ error: null }),
                });
                return (...args: any[]) => ({ then: (cb: any) => cb({ data: null, error: null }) });
            }
        };
        return new Proxy({}, mockHandler) as any;
    }

    client = createBrowserClient(supabaseUrl, supabaseKey)
    return client
}
