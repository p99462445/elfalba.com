import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    console.log('--- SIGNUP REQUEST START ---');
    try {
        const body = await req.json();
        const { email, password, username, phone, role, verificationToken, terms_agreed, privacy_agreed, sms_consent } = body;
        console.log('Payload received for:', email);

        if (!email || !password || !username) {
            console.log('Missing required fields');
            return NextResponse.json({ error: '이메일, 닉네임, 비밀번호는 필수입니다.' }, { status: 400 });
        }

        // 0. 본인인증 데이터 검증 (토큰 방식)
        if (!verificationToken) {
            return NextResponse.json({ error: '본인인증 정보가 누락되었습니다.' }, { status: 400 });
        }

        const vToken = await prisma.verificationToken.findUnique({
            where: { token: verificationToken }
        });

        if (!vToken || vToken.expires_at < new Date()) {
            return NextResponse.json({ error: '본인인증 정보가 만료되었거나 유효하지 않습니다. 다시 인증해 주세요.' }, { status: 400 });
        }

        const verifiedData = vToken.data as any; // { ci, name, birthDate, gender, phone }
        const { ci, name: real_name, birthDate: birthdate, gender } = verifiedData;
        const is_adult = true; // 본인인증 성공했으므로 성인

        // 1. 개인회원(USER)은 여성만 가입 가능
        const isEmployer = role === 'EMPLOYER'
        if (!isEmployer) {
            // PortOne 인증에서 gender는 'M'(남성) 또는 'F'(여성)로 옴
            const isFemale = gender === 'F' || gender === 'FEMALE' || gender === 'female'
            if (!isFemale) {
                return NextResponse.json({
                    error: '개인(구직자) 회원은 여성만 가입하실 수 있습니다. 업소(구인) 회원으로 가입해 주세요.'
                }, { status: 400 })
            }
        }

        // 2. Prisma DB에서 기가입 여부 확인 (이메일 중복 체크 OR 구직자(USER)인 경우 CI 중복 체크)
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    ...(!isEmployer && ci ? [{ ci: ci, role: 'USER' as const }] : [])
                ]
            }
        });

        if (existingUser) {
            console.log('User already exists in Prisma:', email);
            const message = existingUser.email === email
                ? '이미 가입된 이메일 주소입니다.'
                : '이미 이 본인인증 정보로 가입된 계정이 존재합니다.';
            return NextResponse.json({ error: message }, { status: 400 });
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
            // Supabase에서도 이미 가입된 경우 처리
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
                    role: role === 'EMPLOYER' ? 'EMPLOYER' : 'USER',
                    real_name,
                    birthdate,
                    ci,
                    gender,
                    is_adult,
                    terms_agreed: terms_agreed || false,
                    privacy_agreed: privacy_agreed || false,
                    sms_consent: sms_consent || false,
                    verified_at: ci ? new Date() : null,
                }
            });
            console.log('Prisma User Created Successfully');

            // 4.5 1:1 채팅 환영 메시지 자동 발송 (비동기)
            const { sendAutomationMessage } = require('@/lib/chat/automation');
            sendAutomationMessage(
                role === 'EMPLOYER' ? 'WELCOME_EMPLOYER' : 'WELCOME_PERSONAL',
                authData.user.id,
                { name: username }
            ).catch((e: any) => console.error('Welcome chat error:', e));

            // 5. 사용한 토큰 삭제 (1회용)
            await prisma.verificationToken.delete({
                where: { token: verificationToken }
            }).catch((e: any) => console.error('Token delete error:', e));

        } catch (prismaErr: any) {
            console.error('Prisma Create Error:', prismaErr.message);

            // Unique constraint fail (P2002) - email 중복인 경우
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
