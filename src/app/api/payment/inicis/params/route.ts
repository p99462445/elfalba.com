import { NextResponse } from 'next/server';
import { generateSignature, generateVerification, generateMKey } from '@/lib/payment/inicis';

export async function POST(req: Request) {
    try {
        const { oid, price, timestamp } = await req.json();

        if (!oid || !price || !timestamp) {
            return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
        }

        const signature = generateSignature(oid, price, timestamp);
        const verification = generateVerification(oid, price, timestamp);
        const mKey = generateMKey();

        return NextResponse.json({
            mid: process.env.NEXT_PUBLIC_INICIS_MID,
            signature,
            verification,
            mKey
        });
    } catch (error: any) {
        console.error('[InicisParamsAPI] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
