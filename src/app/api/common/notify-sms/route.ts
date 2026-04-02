import { NextResponse } from 'next/server';
import { sendSms } from '@/lib/sms-service';

/**
 * 전역 알림 SMS 발송 API (Refactored to use Aligo Service)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, message, type = 'MANUAL' } = body;

        if (!to || !message) {
            return NextResponse.json({ error: '수신 번호 또는 내용이 없습니다.' }, { status: 400 });
        }

        const result = await sendSms({
            to,
            message,
            type: type as any
        });

        return NextResponse.json({
            success: true,
            message: 'SMS 발송 요청이 접수되었습니다.',
            logId: result.logId
        });
    } catch (error: any) {
        console.error('SMS notify error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
