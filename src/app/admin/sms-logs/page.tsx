export const revalidate = 0;
import prisma from '@/lib/prisma';
import { startOfDay, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import SmsAdminClient from './SmsAdminClient';

export const dynamic = 'force-dynamic';

export default async function SmsLogsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(String(searchParams.page || '1'), 10);
  const tab = String(searchParams.tab || 'logs');
  const limit = 50;
  const skip = (page - 1) * limit;

  // 1. 발송 내역 조회 (logs 탭용)
  const [logs, logTotal] = await Promise.all([
    prisma.smsLog.findMany({
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.smsLog.count(),
  ]);

  // 2. 사이트 설정 조회 (config 탭용)
  const siteConfig = await prisma.siteConfig.findUnique({
    where: { id: 'default' }
  }) || {
    sms_expiry_2d_text: "♥엘프알바♥대표님의 광고가 2일 남으셨어요^.^연장 신청바랍니다 elfalba.com",
    sms_expiry_2d_enabled: true,
    sms_expiry_1d_text: "♥엘프알바♥대표님의 광고가 내일 마감되세요^.^연장 신청바랍니다 elfalba.com",
    sms_expiry_1d_enabled: true,
    sms_expired_1d_text: "♥엘프알바♥대표님의 광고가 마감되었어요^.^연장 신청바랍니다 elfalba.com",
    sms_expired_1d_enabled: true,
    sms_payment_text: "[엘프알바] {금액}원 입금 부탁드립니다. {은행} {계좌} 예금주:{예금주}",
    sms_payment_enabled: true
  };

  const logTotalPages = Math.ceil(logTotal / limit);

  // 오늘 발송 통계
  const todayCount = await prisma.smsLog.count({
    where: { created_at: { gte: startOfDay(new Date()) } }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-transparent min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">SMS 통합 관리</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">오늘 총 {todayCount.toLocaleString()}건 발송됨</div>
      </div>

      {/* 클라이언트 컴포넌트에 데이터 전달 */}
      <SmsAdminClient 
        initialTab={tab}
        logs={logs}
        logTotal={logTotal}
        logPage={page}
        logTotalPages={logTotalPages}
        siteConfig={siteConfig}
      />
    </div>
  );
}
