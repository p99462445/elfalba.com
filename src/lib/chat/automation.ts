import prisma from '@/lib/prisma';

export type AutomationType = 
  | 'WELCOME_PERSONAL'
  | 'WELCOME_EMPLOYER'
  | 'PAYMENT_BANK'
  | 'PAYMENT_CARD'
  | 'EXPIRY_3D'
  | 'EXPIRY_1D'
  | 'EXPIRED_1D'
  | 'QNA_WELCOME';

interface AutomationData {
  name?: string;
  amount?: number;
  bank?: string;
  account?: string;
  owner?: string;
  product_name?: string;
  job_no?: number | string;
  job_title?: string;
  job_id?: string;
  resume_url?: string;
  community_url?: string;
  site_url?: string;
  payment_url?: string;
}

/**
 * 전역 사이트 설정에서 템플릿을 가져와 관리자 명의로 자동 채팅 메시지를 발송합니다.
 */
export async function sendAutomationMessage(type: AutomationType, userId: string, data: AutomationData = {}) {
  try {
    // 1. 사이트 설정 및 관리자 확인
    const [config, admin] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { id: 'default' } }),
      prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { created_at: 'asc' } })
    ]);

    if (!config || !config.chat_automation_enabled || !admin) {
      console.log('Chat automation skipped: config disabled or no admin found.');
      return null;
    }

    // 2. 상황별 템플릿 선택
    let template = '';
    switch (type) {
      case 'WELCOME_PERSONAL': template = config.chat_welcome_personal_text; break;
      case 'WELCOME_EMPLOYER': template = config.chat_welcome_employer_text; break;
      case 'PAYMENT_BANK': template = config.chat_payment_bank_text; break;
      case 'PAYMENT_CARD': template = config.chat_payment_card_text; break;
      case 'EXPIRY_3D': template = config.chat_expiry_3d_text; break;
      case 'EXPIRY_1D': template = config.chat_expiry_1d_text; break;
      case 'EXPIRED_1D': template = config.chat_expired_1d_text; break;
      case 'QNA_WELCOME': template = config.chat_qna_welcome_text; break;
    }

    if (!template) return null;

    // 3. 치환자 변환 (Placeholder Replacement)
    let content = template;
    const siteUrl = process.env.NEXT_PUBLIC_MAIN_URL || 'https://elfalba.com';
    const paymentUrl = data.job_id ? `${siteUrl}/employer/jobs/${data.job_id}/payment` : siteUrl;

    const replacements: Record<string, string> = {
      '{name}': data.name || '회원',
      '{금액}': data.amount?.toLocaleString() || '0',
      '{은행}': data.bank || config.bank_name || '',
      '{계좌}': data.account || config.bank_account || '',
      '{예금주}': data.owner || config.bank_owner || '',
      '{상품명}': data.product_name || '',
      '{job_no}': String(data.job_no || ''),
      '{job_title}': data.job_title || '',
      '{resume_url}': data.resume_url || `${siteUrl}/resume`,
      '{community_url}': data.community_url || `${siteUrl}/community`,
      '{site_url}': siteUrl,
      '{payment_url}': paymentUrl
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.split(key).join(value);
    });

    // 4. 채팅방 조회 또는 생성 (Unique constraint: [user1_id, user2_id])
    const user1_id = admin.id < userId ? admin.id : userId;
    const user2_id = admin.id < userId ? userId : admin.id;

    const room = await prisma.chatRoom.upsert({
      where: {
        user1_id_user2_id: { user1_id, user2_id }
      },
      update: {
        last_message: content,
        last_message_at: new Date()
      },
      create: {
        user1_id,
        user2_id,
        last_message: content,
        last_message_at: new Date()
      }
    });

    // 5. 메시지 생성
    const message = await prisma.message.create({
      data: {
        room_id: room.id,
        sender_id: admin.id,
        content,
        is_read: false
      }
    });

    return message;
  } catch (error) {
    console.error('Failed to send automation chat message:', error);
    return null;
  }
}
