import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    console.log('[PaymentAPI] POST request started')
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !supabaseUser) {
            console.error('[PaymentAPI] Auth failed:', authError)
            return NextResponse.json({ error: '인증 세션이 만료되었습니다. 다시 로그인해 주세요.' }, { status: 401 })
        }

        const body = await request.json()
        const { productId, jobId, amount, depositorName } = body

        console.log('[PaymentAPI] Params:', {
            userId: supabaseUser.id,
            productId,
            jobId,
            amount,
            depositorName
        })

        if (!productId || !amount) {
            return NextResponse.json({ error: '상품 정보나 결제 금액이 누락되었습니다.' }, { status: 400 })
        }

        // Use standard prisma singleton
        const payment = await prisma.payment.create({
            data: {
                user_id: supabaseUser.id,
                product_id: productId,
                job_id: (typeof jobId === 'string' && jobId.length > 5) ? jobId : null,
                amount: parseInt(String(amount).replace(/[^0-9]/g, ''), 10),
                depositor_name: String(depositorName || '').trim() || null,
                payment_method: 'BANK_TRANSFER',
                status: 'PENDING'
            } as any
        }) as any

        console.log('[PaymentAPI] Success! Payment ID:', payment.id)

        // --- 1:1 채팅 자동 안내 발송 (신규!) ---
        try {
            const { sendAutomationMessage } = await import('@/lib/chat/automation');
            const [product] = await Promise.all([
                prisma.product.findUnique({ where: { id: productId } })
            ]);

            await sendAutomationMessage('PAYMENT_BANK', supabaseUser.id, {
                amount: parseInt(String(amount).replace(/[^0-9]/g, ''), 10),
                product_name: product?.name || '상품',
                job_id: (typeof jobId === 'string' && jobId.length > 5) ? jobId : undefined
            });
            console.log('[PaymentAPI] Chat Automation Sent');
        } catch (chatError) {
            console.error('[PaymentAPI] Chat automation failed:', chatError);
        }
        // ------------------------------------

        // --- SMS 알림 발송 로직 (기존) ---
        try {
            const [siteConfig, job, employer] = await Promise.all([
                prisma.siteConfig.findFirst(),
                jobId ? prisma.job.findUnique({ where: { id: jobId }, include: { employer: { include: { user: true } } } }) : null,
                prisma.employer.findFirst({ where: { user_id: supabaseUser.id }, include: { user: true } })
            ]);

            const phone = job?.contact_value || employer?.phone || employer?.user?.phone;

            if (phone && siteConfig?.sms_payment_enabled) {
                const { sendSms, formatSmsMessage } = await import('@/lib/sms-service');
                
                const smsMessage = formatSmsMessage(siteConfig.sms_payment_text || '', {
                    amount: amount,
                    bank: siteConfig.bank_name || '국민은행',
                    account: siteConfig.bank_account || '219401-04-263185',
                    owner: siteConfig.bank_owner || '(주)세컨즈나인',
                    company_name: job?.business_name || employer?.business_name || '대표님'
                });

                await sendSms({
                    to: phone,
                    message: smsMessage,
                    type: 'PAYMENT_INFO'
                });
                console.log('[PaymentAPI] SMS Sent to:', phone);
            }
        } catch (smsError) {
            console.error('[PaymentAPI] SMS sending failed but payment created:', smsError);
        }
        // ----------------------------

        return NextResponse.json({
            success: true,
            paymentId: payment.id,
            message: '결제 요청이 정상적으로 접수되었습니다.'
        })

    } catch (error: any) {
        console.error('[PaymentAPI] ERROR:', error)

        // Return detailed error in dev mode to help diagnose
        const isDev = process.env.NODE_ENV !== 'production'
        const errorMessage = isDev ? `DB 오류: ${error.message}` : '결제 처리 중 서버 오류가 발생했습니다.'

        return NextResponse.json({
            error: errorMessage,
            details: error.code || 'UNKNOWN_ERROR'
        }, { status: 500 })
    }
}
