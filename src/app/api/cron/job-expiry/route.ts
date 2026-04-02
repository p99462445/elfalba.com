import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSms } from '@/lib/sms-service';
import { addDays, startOfDay, endOfDay, isPast, format } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * 매일 오전 실행하여 공고 마감 알림 발송 및 상태 업데이트
 */
export async function GET(req: Request) {
  try {
    // 보안 체크 (선택 사항)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    
    // 0. 사이트 설정(SMS 템플릿) 로드
    const siteConfig = await prisma.siteConfig.findFirst();

    // 1. 마감된 공고 상태 업데이트 (ACTIVE -> EXPIRED)
    const expiredJobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        expired_at: { lte: now },
      },
    });

    console.log(`[ExpiryCron] Updating ${expiredJobs.length} jobs to EXPIRED status.`);
    
    for (const job of expiredJobs) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'EXPIRED' },
      });
    }

    // 2. 알림 발송 대상 조회 (3일 전, 1일 전, 1일 후)
    const targetDate3D = addDays(todayStart, 3);
    const targetDate1D = addDays(todayStart, 1);
    const targetDatePast1D = addDays(todayStart, -1);

    const allRelevantJobs = await prisma.job.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'EXPIRED' }
        ]
      },
      include: {
        employer: { include: { user: true } }
      }
    });

    const results = {
      notified3D: 0,
      notified1D: 0,
      notifiedExpired: 0,
      skipped: 0
    };

    const { formatSmsMessage } = await import('@/lib/sms-service');

    for (const job of allRelevantJobs) {
      const expiryDate = job.vvip_expired_at || job.vip_expired_at || job.normal_expired_at || job.expired_at;
      if (!expiryDate) continue;

      const expiryStart = startOfDay(expiryDate);
      const phone = job.contact_value || job.employer?.phone || job.employer?.user?.phone;

      if (!phone) {
        results.skipped++;
        continue;
      }

      // 기본 데이터 준비
      const formatData = {
        company_name: job.business_name || job.employer?.business_name || '대표님',
        manager_name: job.manager_name || '',
        expiry_date: format(expiryDate, 'yyyy-MM-dd'),
      };

      // 분류 및 발송
      const { sendAutomationMessage } = await import('@/lib/chat/automation');

      if (job.status === 'ACTIVE') {
        if (expiryStart.getTime() === targetDate3D.getTime()) {
          // 마감 3일 전
          if (siteConfig?.sms_expiry_2d_enabled) {
            const message = formatSmsMessage(siteConfig.sms_expiry_2d_text, { ...formatData, days_left: 3 });
            await sendSms({ to: phone, message, type: 'EXPIRY_2D' });
            results.notified3D++;
          }
          // 채팅 자동화 (100% correctly)
          await sendAutomationMessage('EXPIRY_3D', job.employer?.user_id || '', {
              job_title: job.title,
              job_id: job.id
          }).catch(e => console.error('Expiry 3D chat error:', e));
        } 
        else if (expiryStart.getTime() === targetDate1D.getTime()) {
          // 마감 1일 전
          if (siteConfig?.sms_expiry_1d_enabled) {
            const message = formatSmsMessage(siteConfig.sms_expiry_1d_text, { ...formatData, days_left: 1 });
            await sendSms({ to: phone, message, type: 'EXPIRY_1D' });
            results.notified1D++;
          }
          // 채팅 자동화 (100% correctly)
          await sendAutomationMessage('EXPIRY_1D', job.employer?.user_id || '', {
              job_title: job.title,
              job_id: job.id
          }).catch(e => console.error('Expiry 1D chat error:', e));
        }
      } 
      else if (job.status === 'EXPIRED' && expiryStart.getTime() === targetDatePast1D.getTime()) {
        // 마감 1일 후
        if (siteConfig?.sms_expired_1d_enabled) {
          const message = formatSmsMessage(siteConfig.sms_expired_1d_text, formatData);
          await sendSms({ to: phone, message, type: 'EXPIRED_1D' });
          results.notifiedExpired++;
        }
        // 채팅 자동화 (100% correctly)
        await sendAutomationMessage('EXPIRED_1D', job.employer?.user_id || '', {
            job_title: job.title,
            job_id: job.id
        }).catch(e => console.error('Expired 1D chat error:', e));
      }
    }

    return NextResponse.json({
      success: true,
      updated_to_expired: expiredJobs.length,
      notifications: results
    });

  } catch (error: any) {
    console.error('[ExpiryCron] FATAL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
