export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

export async function POST(req: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { id, birthdate, password } = await req.json();
        if (!id || !birthdate) {
            return NextResponse.json({ success: false, message: 'ID와 생년월일을 입력해 주세요.' }, { status: 400 });
        }

        await client.connect();

        // 1. Find Legacy Member
        const findLegacy = 'SELECT * FROM "public"."LegacyMember" WHERE LOWER(username) = LOWER($1) LIMIT 1';
        const legacyRes = await client.query(findLegacy, [id]);

        if (legacyRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: '기존 회원 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        const legacyUser = legacyRes.rows[0];
        const normalizedLegacyBirth = (legacyUser.birthdate || '').replace(/\D/g, '');
        const inputBirth = birthdate.replace(/\D/g, '');
        const birthMatches = (normalizedLegacyBirth === inputBirth) || 
                           (normalizedLegacyBirth.slice(2) === inputBirth) || 
                           (normalizedLegacyBirth === ('19' + inputBirth)) ||
                           (normalizedLegacyBirth === ('20' + inputBirth));

        if (!birthMatches) {
            return NextResponse.json({ success: false, message: '생년월일이 일치하지 않습니다.' }, { status: 401 });
        }

        // 2. Prepare User Data
        let role = 'USER';
        const legacyRoleStr = (legacyUser.role || '');
        if (legacyRoleStr.includes('업') || legacyRoleStr.includes('사장') || legacyRoleStr.includes('업소')) {
            role = 'EMPLOYER';
        }

        const isTempPassword = (!password || password.length < 6);
        const finalPassword = isTempPassword ? '123123' : password;
        const email = `${legacyUser.username.toLowerCase()}@elfalba.com`;

        // 3. Find MASTER record in public.User table (Contains existing jobs)
        const checkMasterRes = await client.query(
            'SELECT id, is_activated FROM "public"."User" WHERE LOWER(old_id) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1', 
            [legacyUser.username, email]
        );
        const masterRecord = checkMasterRes.rows[0];

        if (masterRecord?.is_activated) {
             return NextResponse.json({ success: false, message: '이미 이사가 완료된 회원입니다. 일반 로그인을 이용해 주세요.' }, { status: 400 });
        }

        let targetAuthId: string | null = masterRecord?.id || null;

        // 4. Sync with Supabase Auth
        // Case A: Another account is occupying this email in Auth
        const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const conflictingAuthUser = existingAuthUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (conflictingAuthUser) {
            if (targetAuthId && conflictingAuthUser.id !== targetAuthId) {
                console.log(`[Migration] Deleting conflicting Auth user ${conflictingAuthUser.id} to favor Master ID ${targetAuthId}`);
                await supabaseAdmin.auth.admin.deleteUser(conflictingAuthUser.id);
            } else if (!targetAuthId) {
                targetAuthId = conflictingAuthUser.id;
            }
        }

        // Case B: Master ID is NOT in Auth yet -> CREATE with explicit ID
        if (targetAuthId) {
            const { data: authCheck } = await supabaseAdmin.auth.admin.getUserById(targetAuthId);
            if (!authCheck?.user) {
                console.log(`[Migration] Injecting Master ID ${targetAuthId} into Supabase Auth...`);
                const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    id: targetAuthId,
                    email,
                    password: finalPassword,
                    email_confirm: true,
                    user_metadata: { role, is_adult: true, display_name: legacyUser.name || legacyUser.username }
                });
                if (createError) throw createError;
            } else {
                // Already in Auth with correct ID -> Just update password
                console.log(`[Migration] Correct Auth account found. Updating password for ${targetAuthId}`);
                await supabaseAdmin.auth.admin.updateUserById(targetAuthId, { password: finalPassword });
            }
        } else {
            // Case C: No Master Record exists -> Fresh migration
            console.log(`[Migration] No Master record. Creating fresh account...`);
            const { data: fresh, error: freshError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: finalPassword,
                email_confirm: true,
                user_metadata: { role, is_adult: true, display_name: legacyUser.name || legacyUser.username }
            });
            if (freshError) throw freshError;
            targetAuthId = fresh.user.id;
        }

        // 5. Finalize public.User record (Upsert to ensure activation)
        const upsertUserSql = `
            INSERT INTO "public"."User" ("id", "email", "name", "real_name", "phone", "role", "is_adult", "verified_at", "birthdate", "old_id", "status", "is_activated", "updated_at")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())
            ON CONFLICT (id) DO UPDATE SET 
                "email" = EXCLUDED.email, "name" = EXCLUDED.name, "phone" = EXCLUDED.phone, "is_activated" = true, "updated_at" = NOW(), "old_id" = COALESCE("User".old_id, EXCLUDED.old_id)
        `;
        await client.query(upsertUserSql, [
            targetAuthId, email,
            legacyUser.name || legacyUser.username,
            legacyUser.name, legacyUser.phone,
            role, true, new Date(), legacyUser.birthdate,
            legacyUser.username, 'ACTIVE'
        ]);

        await client.query('UPDATE "public"."LegacyMember" SET is_migrated = true, updated_at = NOW() WHERE username = $1', [legacyUser.username]);

        // 6. 1:1 채팅 환영 메시지 자동 발송 (비동기)
        try {
            const { sendAutomationMessage } = require('@/lib/chat/automation');
            sendAutomationMessage(
                role === 'EMPLOYER' ? 'WELCOME_EMPLOYER' : 'WELCOME_PERSONAL',
                targetAuthId,
                { name: legacyUser.name || legacyUser.username }
            ).catch((e: any) => console.error('Migration welcome chat error:', e));
        } catch (e) {
            console.error('Automation require error:', e);
        }

        return NextResponse.json({
            success: true,
            message: isTempPassword 
                ? '이사 성공! 다만 비밀번호가 6자리 미만이라 123123으로 임시 변경되었습니다. 보안을 위해 로그인 후 반드시 비밀번호를 변경해 주세요!'
                : '이사 성공! 기존 사이트에서 사용하시던 비밀번호 그대로 이사가 완료되었습니다.',
            email,
            password: finalPassword,
            isTempPassword
        });

    } catch (error: any) {
        console.error('Migration API Error:', error);
        return NextResponse.json({ 
            success: false, 
            message: `이사 처리 중 오류가 발생했습니다. 대표번호(1899-0930)로 문의주시면 도와드리겠습니다.` 
        }, { status: 500 });
    } finally {
        await client.end();
    }
}
