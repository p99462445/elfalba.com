import prisma from '@/lib/prisma';

/**
 * 결제 성공 결과를 DB에 반영하고 공고를 연장/활성화하는 공통 서비스
 */
export async function applyPaymentResult(tx: any, {
    paymentId,
    userId,
    jobId,
    productId,
    amount,
    method,
    pgTid,
    paymentInfo
}: {
    paymentId?: string;
    userId: string;
    jobId: string;
    productId: string;
    amount: number;
    method: 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT';
    pgTid?: string;
    paymentInfo?: any;
}) {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error(`상품 정보를 찾을 수 없습니다: ${productId}`);

    // 1. 결제 레코드 업데이트 (이미 생성된 경우) 또는 생성
    let payment;
    if (paymentId) {
        payment = await tx.payment.update({
            where: { id: paymentId },
            data: {
                status: 'APPROVED',
                pg_transaction_id: pgTid,
                payment_info: paymentInfo,
                updated_at: new Date()
            }
        });
    } else {
        // Webhook 등에서 직접 생성해야 하는 경우 (모바일 P_NOTI 등)
        // 중복 생성 방지 로직 필요 (TID 기준 등)
        if (pgTid) {
            const existing = await tx.payment.findFirst({ where: { pg_transaction_id: pgTid } });
            if (existing) return existing;
        }

        payment = await tx.payment.create({
            data: {
                user_id: userId,
                job_id: jobId,
                product_id: productId,
                amount: product.price || amount,
                payment_method: method,
                status: 'APPROVED',
                pg_transaction_id: pgTid,
                payment_info: paymentInfo,
                depositor_name: method === 'CARD' ? '카드결제' : '무통장'
            }
        });
    }

    // 2. 공고 기간 연장 및 상태 변경
    const job = await tx.job.findUnique({ where: { id: jobId } });
    const now = new Date();

    // [사장님 요청]: 날짜가 남은 공고만 자동 승인, 날짜 없는 공고는 관리자가 수동 승인
    const hasRemainingDate = job?.expired_at && job.expired_at > now;

    if (hasRemainingDate && job?.expired_at) {
        const currentExpiry = job.expired_at;
        const duration = product.duration_days || 0;
        const newExpiry = new Date(currentExpiry.getTime() + duration * 24 * 60 * 60 * 1000);

        await tx.job.update({
            where: { id: jobId },
            data: {
                status: 'ACTIVE',
                expired_at: newExpiry,
                vvip_expired_at: product.product_type === 'VVIP_SLOT' ? newExpiry : undefined,
                vip_expired_at: product.product_type === 'VIP_SLOT' ? newExpiry : undefined,
                normal_expired_at: product.product_type === 'GENERAL_SLOT' ? newExpiry : undefined,
            }
        });
        
        console.log(`[PaymentService] Job ${jobId} 자동 연장 완료`);
    } else {
        // 날짜가 없거나 만료된 공고는 결제만 완료하고(이미 위에서함) 공고는 수동 승인 대기
        // 단, 결제 상태는 APPROVED가 아닌 PENDING으로 유지해야 관리자 페이지에서 '승인' 버튼이 보임
        await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'PENDING' }
        });
        console.log(`[PaymentService] Job ${jobId} 수동 승인 대기 처리 (PENDING)`);
    }

    return payment;
}
