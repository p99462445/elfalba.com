import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      sms_expiry_2d_text, sms_expiry_2d_enabled,
      sms_expiry_1d_text, sms_expiry_1d_enabled,
      sms_expired_1d_text, sms_expired_1d_enabled,
      sms_payment_text, sms_payment_enabled
    } = body;

    const config = await prisma.siteConfig.upsert({
      where: { id: 'default' },
      update: {
        sms_expiry_2d_text, sms_expiry_2d_enabled,
        sms_expiry_1d_text, sms_expiry_1d_enabled,
        sms_expired_1d_text, sms_expired_1d_enabled,
        sms_payment_text, sms_payment_enabled
      },
      create: {
        id: 'default',
        sms_expiry_2d_text, sms_expiry_2d_enabled,
        sms_expiry_1d_text, sms_expiry_1d_enabled,
        sms_expired_1d_text, sms_expired_1d_enabled,
        sms_payment_text, sms_payment_enabled
      }
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('[AdminConfigAPI] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
