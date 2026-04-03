import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendAutomationMessage } from '@/lib/chat/automation'

export async function POST(req: Request) {
    console.log('--- SIGNUP REQUEST START ---');
    try {
        const body = await req.json();
        const { email, password, username, phone, role, terms_agreed, privacy_agreed, sms_consent } = body;
        console.log('Payload received for:', email);

        if (!email || !password || !username) {
            console.log('Missing required fields');
            return NextResponse.json({ error: '이메일, 닉네임, 비밀번호는 필수입니다.' }, { status: 400 });
        }

        const isEmployer = role === 'EMPLOYER';

        // 2. Prisma DB에서 기가입 여부 확인 (이메일 중복 체크)
        const existingUser = await prisma.user.findFirst({
            where: { email: email }
        });

        if (existingUser) {
            console.log('User already exists in Prisma:', email);
            return NextResponse.json({ error: '이미 가입된 이메일 주소입니다.' }, { status: 400 });
        }

        console.log('Initializing Supabase client...');
        const supabase = await createClient();

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
        console.log('Attempting Supabase Auth signUp with siteUrl:', siteUrl);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nickname: username },
                emailRedirectTo: `${siteUrl}/auth/callback`
            }
        });

        if (authError) {
            console.error('Supabase Auth Error:', authError.message);
            if (authError.message.includes('already registered')) {
                return NextResponse.json({ error: '이미 가입된 이메일 주소입니다.' }, { status: 400 });
            }
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            console.error('No user returned from Supabase Auth');
            return NextResponse.json({ error: '회원가입에 실패했습니다 (User null).' }, { status: 500 });
        }

        console.log('Supabase Auth Success. User ID:', authData.user.id);
        console.log('Creating user in Prisma DB...');

        try {
            await prisma.user.create({
                data: {
                    id: authData.user.id,
                    email,
                    nickname: username,
                    phone: phone || null,
                    role: isEmployer ? 'EMPLOYER' : 'USER',
                    is_adult: true, // Bypass verification
                    terms_agreed: terms_agreed || false,
                    privacy_agreed: privacy_agreed || false,
                    sms_consent: sms_consent || false,
                }
            });
            console.log('Prisma User Created Successfully');

            // 4.5 1:1 채팅 환영 메시지 자동 발송 (비동기)
            sendAutomationMessage(
                isEmployer ? 'WELCOME_EMPLOYER' : 'WELCOME_PERSONAL',
                authData.user.id,
                { name: username }
            ).catch((e: any) => console.error('Welcome chat error:', e));

        } catch (prismaErr: any) {
            console.error('Prisma Create Error:', prismaErr.message);

            if (prismaErr.code === 'P2002') {
                return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 400 });
            }

            return NextResponse.json({ error: `DB 저장 실패: ${prismaErr.message}` }, { status: 500 });
        }

        console.log('--- SIGNUP COMPLETED SUCCESSFULLY ---');
        return NextResponse.json({
            message: '회원가입이 완료되었습니다.',
            user: { id: authData.user.id, email: authData.user.email }
        });

    } catch (error: any) {
        console.error('CRITICAL SIGNUP ERROR:', error);
        return NextResponse.json({
            error: error.message || '알 수 없는 서버 오류가 발생했습니다.'
        }, { status: 500 });
    }
}
