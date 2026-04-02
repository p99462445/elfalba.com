import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applyPaymentResult } from '@/lib/payment/service';

/**
 * 포트원 V2 웹훅 핸들러
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { paymentId } = body;

        if (!paymentId) return NextResponse.json({ message: 'paymentId is missing' }, { status: 400 });

        // 1. 포트원 API 시크릿 확인
        const apiSecret = process.env.PORTONE_API_SECRET;
        if (!apiSecret) return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });

        // 2. 포트원 서버에서 상세 내역 조회
        const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
            method: 'GET',
            headers: { 'Authorization': `PortOne ${apiSecret}` }
        });

        if (!response.ok) return NextResponse.json({ message: 'Failed to verify' }, { status: 400 });
        const payment = await response.json();

        // 3. 결제 완료 상태인 경우에만 DB 처리
        if (payment.status === 'PAID') {
            const { jobId, productId } = payment.customData || {};
            
            if (jobId && productId) {
                // 내부 Enum으로 변환 (CARD, BANK_TRANSFER, VIRTUAL_ACCOUNT)
                let method: 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT' = 'CARD';
                if (payment.payMethod === 'TRANSFER') method = 'BANK_TRANSFER';
                if (payment.payMethod === 'VBANK') method = 'VIRTUAL_ACCOUNT';

                await prisma.$transaction(async (tx) => {
                    await applyPaymentResult(tx, {
                        userId: payment.customer?.id || 'system_webhook',
                        jobId,
                        productId,
                        amount: payment.amount.total,
                        method,
                        paymentId: paymentId,
                        paymentInfo: {
                            webhook: true,
                            pg: payment.channel?.pgProvider,
                            raw: payment
                        }
                    });
                });
                console.log(`[PortOneWebhook] Successfully processed payment ${paymentId} for job ${jobId}`);
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('[PortOneWebhook] Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
