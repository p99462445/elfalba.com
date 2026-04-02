import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applyPaymentResult } from '@/lib/payment/service';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const pStatus = formData.get('P_STATUS'); // 성공 시 '00'
        const pTid = formData.get('P_TID');
        const pAmt = formData.get('P_AMT');
        const pOid = formData.get('P_OID');
        const pNoti = formData.get('P_NOTI'); // merchantData (jobId:productId:userId:isPopup)

        console.log('[InicisMobileNoti] Webhook Received:', { pStatus, pTid, pAmt, pOid, pNoti });

        if (pStatus === '00' && pNoti) {
            const [jobId, productId, userId, isPopupFlag] = String(pNoti).split(':');

            await prisma.$transaction(async (tx) => {
                await applyPaymentResult(tx, {
                    userId,
                    jobId,
                    productId,
                    amount: Number(pAmt),
                    method: 'CARD',
                    pgTid: String(pTid),
                    paymentInfo: Object.fromEntries(formData.entries())
                });
            });
            
            console.log('[InicisMobileNoti] DB Update Success');
            // 이니시스 통보 응답은 반드시 'OK'로 시작해야 함
            return new Response('OK', { headers: { 'Content-Type': 'text/plain' } });
        }

        return new Response('FAIL', { headers: { 'Content-Type': 'text/plain' } });
    } catch (error: any) {
        console.error('[InicisMobileNoti] Error:', error);
        return new Response('ERROR', { headers: { 'Content-Type': 'text/plain' } });
    }
}
