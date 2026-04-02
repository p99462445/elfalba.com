import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applyPaymentResult } from '@/lib/payment/service';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const pStatus = formData.get('P_STATUS');
        const pRmMsg = formData.get('P_RMESG1');
        const pTid = String(formData.get('P_TID') || '');
        const pAmt = Number(formData.get('P_AMT') || 0);
        const pOid = String(formData.get('P_OID') || '');
        const pNoti = String(formData.get('P_NOTI') || ''); // merchantData (jobId:productId:userId:isPopup)

        const allEntries = Object.fromEntries(formData.entries());
        console.log('[InicisMobileNext] Browser Return Data:', allEntries);

        const url = new URL(req.url);
        const baseUrl = `${url.protocol}//${url.host}`;

        if (pStatus === '00' && pNoti) {
            // [로컬 개발 환경 대응]
            // 로컬에서는 이니시스 서버가 NOTI_URL(웹훅)로 접근할 수 없으므로,
            // 브라우저가 돌아온 이 시점에 DB 업데이트를 수행함.
            try {
                const [jobId, productId, userId] = pNoti.split(':');
                if (jobId && productId && userId) {
                    await prisma.$transaction(async (tx) => {
                        await applyPaymentResult(tx, {
                            userId,
                            jobId,
                            productId,
                            amount: pAmt,
                            method: 'CARD',
                            pgTid: pTid,
                            paymentInfo: allEntries
                        });
                    });
                    console.log('[InicisMobileNext] Local fallback DB update success');
                }
            } catch (dbError) {
                console.error('[InicisMobileNext] DB Update Error:', dbError);
                // 결제 자체는 성공했으므로 사용자에게는 성공 페이지를 보여줌
            }

            const finalOid = pOid || pOid.toLowerCase() || 'M_UNKNOWN';
            return NextResponse.redirect(`${baseUrl}/employer/payments/success?success=true&isPopup=false&tid=${pTid}&oid=${finalOid}`);
        } else {
            // 실패 시 에러 페이지로 리다이렉트
            return NextResponse.redirect(`${baseUrl}/employer/payments?error=${encodeURIComponent(String(pRmMsg || '결제 실패'))}`);
        }
    } catch (error: any) {
        console.error('[InicisMobileNext] Error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_MAIN_URL}/employer/payments?error=system_error`);
    }
}
