import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applyPaymentResult } from '@/lib/payment/service';

export async function POST(req: Request) {
    try {
        const { paymentId, jobId, productId } = await req.json();

        if (!paymentId || !jobId || !productId) {
            return NextResponse.json({ message: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
        }

        // 1. 포트원 API 시크릿 확인
        const apiSecret = process.env.PORTONE_API_SECRET;
        if (!apiSecret || apiSecret === 'WAITING_FOR_USER') {
            console.error('[PortOneVerify] API Secret is missing');
            return NextResponse.json({ message: '서버 결제 설정이 완료되지 않았습니다.' }, { status: 500 });
        }

        // 2. 포트원 결제 내역 단건 조회 (V2 API)
        // reference: https://developers.portone.io/api-reference/v2/payment/get-payment
        const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `PortOne ${apiSecret}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[PortOneVerify] PortOne API Error:', error);
            return NextResponse.json({ message: '결제 정보 조회에 실패했습니다.' }, { status: response.status });
        }

        const payment = await response.json();

        // 3. 결제 상태 및 금액 검증
        if (payment.status !== 'PAID') {
            return NextResponse.json({ message: `결제가 완료되지 않은 상태입니다. (상태: ${payment.status})` }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return NextResponse.json({ message: '상품 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 금액 검증 (포트원은 totalAmount 필드 사용)
        if (payment.amount.total !== product.price) {
            console.error(`[PortOneVerify] Amount mismatch! Expected: ${product.price}, Actual: ${payment.amount.total}`);
            return NextResponse.json({ message: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
        }

        // 4. DB 반영 (기존 공통 서비스 활용)
        await prisma.$transaction(async (tx) => {
            await applyPaymentResult(tx, {
                userId: payment.customer.id || 'system',
                jobId: jobId,
                productId: productId,
                amount: payment.amount.total,
                method: 'CARD', // 포트원 payMethod에 따라 분기 가능
                pgTid: paymentId,
                paymentInfo: payment
            });
        });

        console.log(`[PortOneVerify] Payment success & DB updated: ${paymentId}`);

        // --- 1:1 채팅 자동 안내 발송 (신규!) ---
        try {
            const { sendAutomationMessage } = await import('@/lib/chat/automation');
            await sendAutomationMessage('PAYMENT_CARD', payment.customer.id || 'system', {
                amount: payment.amount.total,
                product_name: product.name,
                job_no: jobId, // or fetch real job_no if needed, but jobId is common
                job_id: jobId
            });
            console.log('[PortOneVerify] Chat Automation Sent');
        } catch (chatError) {
            console.error('[PortOneVerify] Chat automation failed:', chatError);
        }
        // ------------------------------------

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[PortOneVerify] Unexpected Error:', error);
        return NextResponse.json({ message: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

// GET 요청은 모바일 리다이렉트 처리용
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');
    const jobId = searchParams.get('jobId');
    const productId = searchParams.get('productId');
    const code = searchParams.get('code');
    const message = searchParams.get('message');

    const baseUrl = new URL(req.url).origin;

    if (code) {
        return NextResponse.redirect(`${baseUrl}/employer/payments/success?success=false&message=${encodeURIComponent(message || '결제 실패')}`);
    }

    if (!paymentId || !jobId || !productId) {
        return NextResponse.redirect(`${baseUrl}/employer/payments/success?success=false&message=파라미터누락`);
    }

    try {
        const apiSecret = process.env.PORTONE_API_SECRET;
        const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `PortOne ${apiSecret}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('조회실패');
        const payment = await response.json();

        if (payment.status === 'PAID') {
            await prisma.$transaction(async (tx) => {
                await applyPaymentResult(tx, {
                    userId: payment.customer.id || 'system',
                    jobId: jobId,
                    productId: productId,
                    amount: payment.amount.total,
                    method: 'CARD',
                    pgTid: paymentId,
                    paymentInfo: payment
                });
            });

            // --- 1:1 채팅 자동 안내 발송 (신규! - GET Redirect 용) ---
            try {
                const { sendAutomationMessage } = await import('@/lib/chat/automation');
                const product = await prisma.product.findUnique({ where: { id: productId } });
                await sendAutomationMessage('PAYMENT_CARD', payment.customer.id || 'system', {
                    amount: payment.amount.total,
                    product_name: product?.name || '상품',
                    job_id: jobId
                });
            } catch (chatError) {
                console.error('[PortOneVerify_GET] Chat automation failed:', chatError);
            }
            // ---------------------------------------------------

            return NextResponse.redirect(`${baseUrl}/employer/payments/success?success=true&tid=${paymentId}&oid=${jobId}`);
        }
    } catch (e) {
        console.error('[PortOneVerify_GET] Error:', e);
    }

    return NextResponse.redirect(`${baseUrl}/employer/payments/success?success=false&tid=${paymentId}&oid=${jobId}&message=검증오류`);
}
