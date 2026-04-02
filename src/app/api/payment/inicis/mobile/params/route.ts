import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto'; // 해시 생성을 위해 추가

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { jobId, productId, amount } = body;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const mid = process.env.NEXT_PUBLIC_INICIS_MID || 'INIpayTest';
        const oid = `M_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // P_NEXT_URL: 결제 완료 후 사용자의 화면이 이동할 목적지
        // 현재 접속한 주소(origin)를 동적으로 추출하여 .env 설정과 포트가 달라도 작동하게 함
        const url = new URL(req.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        // merchantData에 필요한 정보를 담아서 보냄 (P_NOTI 수신 시 복원 위함)
        // 모바일은 merchantData 형식이 제한적일 수 있으므로 P_RESERVED 등을 활용하기도 함
        const merchantData = `${jobId}:${productId}:${user.id}:true`;

        // P_RESERVED: 모바일 위변조 방지용 hashdata 생성 (사장님이 주신 HashKey 활용)
        const mobileHashKey = process.env.INICIS_MOBILE_HASH_KEY || '';
        let reservedString = 'twotrs_isp=Y&block_isp=Y&twotrs_bank=Y&block_bank=Y&vbank_receipt=Y&apprun_check=Y';
        
        if (mobileHashKey) {
            // hashdata = sha256(mid + oid + amt + hashKey)
            const hashDataStr = mid + oid + product.price + mobileHashKey;
            const hashData = crypto.createHash('sha256').update(hashDataStr).digest('hex');
            reservedString += `&hashdata=${hashData}`;
        }

        const params = {
            P_MID: mid,
            P_OID: oid,
            P_AMT: product.price,
            P_GOODS: product.name,
            P_UNAME: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
            P_NEXT_URL: `${baseUrl}/api/payment/inicis/mobile/next`,
            P_NOTI_URL: `${baseUrl}/api/payment/inicis/mobile/noti`,
            P_NOTI: merchantData,
            P_CHARSET: 'utf8',
            P_INI_PAYMENT: 'CARD', // 필수: 결제수단 (CARD, BANK, VBANK 등)
            P_HPP_METHOD: '1',
            P_RESERVED: reservedString
        };

        return NextResponse.json(params);
    } catch (error: any) {
        console.error('[InicisMobileParams] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
