import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isAdult } from '@/lib/utils/auth-utils'

/**
 * [예시] 본인인증 결과를 처리하는 API
 * 포트원/KCP 연동 시 이 엔드포인트에서 최종 검증을 수행합니다.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { identityVerificationId } = body

        if (!identityVerificationId) {
            return NextResponse.json({ error: 'MISSING_ID', message: '인증 ID가 누락되었습니다.' }, { status: 400 })
        }

        // 1. 포트원 본인인증 내역 단건조회 API 호출하여 데이터 획득
        console.log("Using API Secret:", process.env.PORTONE_API_SECRET ? "Exists (hidden)" : "Missing");
        const response = await fetch(
            `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
            {
                headers: {
                    'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            console.error('PortOne API Error:', errorData)
            return NextResponse.json({
                error: 'PORTONE_API_FAILED',
                message: '본인인증 서버 통신에 실패했습니다.'
            }, { status: response.status })
        }

        const verification = await response.json()

        // 인증 상태 확인
        if (verification.status !== 'VERIFIED') {
            return NextResponse.json({
                error: 'NOT_VERIFIED',
                message: '본인인증이 완료되지 않았습니다.'
            }, { status: 400 })
        }

        const { ci, name, birthDate, gender } = verification.verifiedCustomer

        // 2. 만 나이 성인 체크
        if (!isAdult(birthDate)) {
            return NextResponse.json({
                error: 'AGE_VERIFICATION_FAILED',
                message: '만 19세 미만 미성년자는 가입할 수 없습니다.'
            }, { status: 403 })
        }

        // 3. 중복 가입 체크 (CI 기준)
        const existingUser = await prisma.user.findFirst({
            where: { ci }
        })

        if (existingUser) {
            return NextResponse.json({
                error: 'DUPLICATE_USER',
                message: '이미 이 본인인증 정보로 가입된 계정이 존재합니다.'
            }, { status: 409 })
        }

        // 4. 보안 조치: CI 등 민감정보 노출 방지를 위해 서버 측에 임시 토큰 발행
        const { randomUUID } = await import('crypto')
        const token = randomUUID()
        const expiresAt = new Date(Date.now() + 1000 * 60 * 30) // 30분 유효

        await prisma.verificationToken.create({
            data: {
                token,
                data: {
                    ci,
                    name,
                    birthDate,
                    gender,
                    phone: verification.verifiedCustomer.phone || null
                },
                expires_at: expiresAt
            }
        })

        // 5. 인증 정보 반환 (브라우저에는 CI를 절대 보내지 않음)
        return NextResponse.json({
            success: true,
            verificationToken: token,
            verifiedData: {
                name,
                birthDate,
                gender,
                phone: verification.verifiedCustomer.phone || '010-0000-0000'
            }
        })

    } catch (error: any) {
        console.error('Verification Route Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
