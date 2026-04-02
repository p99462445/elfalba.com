import prisma from './prisma';

/**
 * 알리고(Aligo) SMS 발송 서비스
 */

const ALIGO_API_KEY = process.env.ALIGO_API_KEY || '';
const ALIGO_USER_ID = process.env.ALIGO_USER_ID || '';
const ALIGO_SENDER = process.env.ALIGO_SENDER || '';
const ALIGO_API_URL = 'https://apis.aligo.in/send/';

export type SmsType = 'EXPIRY_2D' | 'EXPIRY_1D' | 'EXPIRED_1D' | 'PAYMENT_INFO' | 'GENERAL';

interface SendSmsParams {
  to: string;
  message: string;
  type: SmsType;
}

/**
 * 치환 문자열(Placeholder) 포맷팅
 */
export function formatSmsMessage(template: string, data: any) {
  let msg = template;
  
  // 공통
  if (data.company_name) msg = msg.replace(/\{업소명\}/g, data.company_name);
  if (data.manager_name) msg = msg.replace(/\{담당자\}/g, data.manager_name);
  
  // 마감 관련
  if (data.expiry_date) msg = msg.replace(/\{마감일\}/g, data.expiry_date);
  if (data.days_left !== undefined) msg = msg.replace(/\{남은일수\}/g, String(data.days_left));
  
  // 결제 관련
  if (data.amount) msg = msg.replace(/\{금액\}/g, Number(data.amount).toLocaleString());
  if (data.bank) msg = msg.replace(/\{은행\}/g, data.bank);
  if (data.account) msg = msg.replace(/\{계좌\}/g, data.account);
  if (data.owner) msg = msg.replace(/\{예금주\}/g, data.owner);
  
  return msg;
}

/**
 * SMS 발송 및 이력 기록
 */
export async function sendSms({ to, message, type }: SendSmsParams) {
  console.log(`[SMS_SERVICE] Attempting to send ${type} to ${to}`);
  
  // 1. DB에 PENDING 상태로 먼저 기록
  const log = await prisma.smsLog.create({
    data: {
      to,
      message,
      type,
      status: 'PENDING',
    },
  });

  // API 키가 없거나 발송 정보가 누락되면 시뮬레이션 모드로 작동
  if (!ALIGO_API_KEY || !ALIGO_USER_ID || !ALIGO_SENDER) {
    console.warn('[SMS_SERVICE] Aligo API keys are missing. Operating in SIMULATION mode.');
    await prisma.smsLog.update({
      where: { id: log.id },
      data: {
        status: 'SUCCESS',
        error_message: '(SIMULATION) API 키 설정 시 실제 발송됩니다.',
      },
    });
    return { success: true, message: 'Simulation mode: Log created.', logId: log.id };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('key', ALIGO_API_KEY);
    formData.append('user_id', ALIGO_USER_ID);
    formData.append('sender', ALIGO_SENDER);
    formData.append('receiver', to);
    formData.append('msg', message);

    const response = await fetch(ALIGO_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.result_code === '1') {
      // 성공
      await prisma.smsLog.update({
        where: { id: log.id },
        data: { status: 'SUCCESS' },
      });
      return { success: true, data: result };
    } else {
      // 실패 (알리고 응답 에러)
      await prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILURE',
          error_message: `Aligo Error (${result.result_code}): ${result.message}`,
        },
      });
      return { success: false, error: result.message };
    }
  } catch (error: any) {
    // 시스템 에러 (네트워크 등)
    console.error('[SMS_SERVICE] Fatal error:', error);
    await prisma.smsLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILURE',
        error_message: error.message,
      },
    });
    return { success: false, error: error.message };
  }
}
