import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

export async function POST(req: Request) {
    // 보안: 오직 로컬호스트에서만 작동하도록 제한 (필요시 주석 처리)
    if (process.env.NODE_ENV !== 'development' && !req.url.includes('localhost')) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID가 필요합니다.' }, { status: 400 });

    const email = `${id.toLowerCase()}@elfalba.com`;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log(`[Reset API] Resetting user: ${id}`);

        // 1. Delete from Auth
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (target) {
            await supabaseAdmin.auth.admin.deleteUser(target.id);
            console.log(`[Reset API] Deleted Auth user: ${target.id}`);
        }

        // 2. Reset Public User
        await client.query('UPDATE "public"."User" SET is_activated = false WHERE LOWER(old_id) = LOWER($1) OR LOWER(email) = LOWER($2)', [id, email]);

        // 3. Reset Legacy Member
        await client.query('UPDATE "public"."LegacyMember" SET is_migrated = false WHERE LOWER(username) = LOWER($1)', [id]);

        return NextResponse.json({ success: true, message: `${id} 회원이 '이사 전' 상태로 초기화되었습니다.` });

    } catch (error: any) {
        console.error('[Reset API] Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    } finally {
        await client.end();
    }
}
