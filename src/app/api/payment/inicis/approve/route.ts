import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { generateAuthSignature, generateAuthVerification, getAuthUrl } from '@/lib/payment/inicis';
import { applyPaymentResult } from '@/lib/payment/service';

export async function GET() {
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>결제 요청중...</title>
        <script>
            // 이니시스 SDK가 팝업을 찾을 때 필요한 이름 설정
            window.name = "INIpayStd_popup";
        </script>
        <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #fff; margin: 0; padding: 20px; }
            .container { text-align: center; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            p { color: #666; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="spinner"></div>
            <p>이니시스 결제창을 불러오는 중입니다...<br/>잠시만 기다려 주세요.</p>
        </div>
    </body>
    </html>
    `;
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const isPopup = searchParams.get('isPopup') === 'true';

        // 이니시스 리턴은 application/x-www-form-urlencoded 형식임
        const formData = await req.formData();
        const resultCode = formData.get('resultCode') as string;
        const resultMsg = formData.get('resultMsg') as string;
        const mid = formData.get('mid') as string;
        const authToken = formData.get('authToken') as string;
        const authUrl = formData.get('authUrl') as string;
        const netCancelUrl = formData.get('netCancelUrl') as string;
        const idc_name = formData.get('idc_name') as string;
        const merchantData = formData.get('merchantData') as string; // 여기에 jobId:productId 등이 들어있음

        if (resultCode !== '0000') {
            console.error('[InicisApprove] 인증 실패:', resultCode, resultMsg);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_MAIN_URL}/employer/payments?error=${encodeURIComponent(resultMsg)}`);
        }

        // 2단계 승인 요청 준비
        const timestamp = new Date().getTime().toString();
        const signature = generateAuthSignature(authToken, timestamp);
        const verification = generateAuthVerification(authToken, timestamp);

        const targetAuthUrl = getAuthUrl(idc_name);
        
        // 승인 API 호출
        const response = await fetch(targetAuthUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                mid,
                authToken,
                signature,
                verification,
                timestamp,
                charset: 'UTF-8',
                format: 'JSON'
            })
        });

        const result = await response.json();

        if (result.resultCode === '0000') {
            // 승인 성공 -> DB 작업
            const [jobId, productId, userId, isPopupFlag] = merchantData.split(':');
            console.log('[InicisApprove] DB 작업 시작:', { jobId, productId, userId, isPopupFlag, tid: result.tid });
            
            try {
                await prisma.$transaction(async (tx) => {
                    await applyPaymentResult(tx, {
                        userId,
                        jobId,
                        productId,
                        amount: 0, // find from product in service
                        method: 'CARD',
                        pgTid: result.tid,
                        paymentInfo: result
                    });
                });
            } catch (dbError: any) {
                console.error('[InicisApprove] DB 트랜잭션 에러:', dbError);
                throw dbError; // 상위 catch에서 처리
            }

            if (isPopupFlag === 'true') {
                return NextResponse.redirect(new URL('/employer/payments/success?isPopup=true', req.url));
            }
            return NextResponse.redirect(new URL('/employer/payments?success=true', req.url));
        } else {
            console.error('[InicisApprove] 최종 승인 실패:', result.resultCode, result.resultMsg);
            const errorUrl = new URL('/employer/payments/success', req.url);
            if (isPopup) errorUrl.searchParams.set('isPopup', 'true');
            errorUrl.searchParams.set('error', result.resultMsg);
            return NextResponse.redirect(errorUrl);
        }

    } catch (error: any) {
        console.error('[InicisApprove] 치명적 에러:', error);
        // 에러 메시지를 포함해서 리다이렉트 (디버깅용)
        const errMsg = error?.message || 'system_error';
        return NextResponse.redirect(new URL(`/employer/payments?error=${encodeURIComponent(errMsg)}`, req.url));
    }
}
