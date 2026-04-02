const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default SMS settings...');
  
  await prisma.siteConfig.upsert({
    where: { id: 'default' },
    update: {
      sms_expiry_2d_text: "♥엘프알바♥대표님의 광고가 2일 남으셨어요^.^연장 신청바랍니다 elfalba.com",
      sms_expiry_2d_enabled: true,
      sms_expiry_1d_text: "♥엘프알바♥대표님의 광고가 내일 마감되세요^.^연장 신청바랍니다 elfalba.com",
      sms_expiry_1d_enabled: true,
      sms_expired_1d_text: "♥엘프알바♥대표님의 광고가 마감되었어요^.^연장 신청바랍니다 elfalba.com",
      sms_expired_1d_enabled: true,
      sms_payment_text: "[엘프알바] {금액}원 입금 부탁드립니다. {은행} {계좌} 예금주:{예금주}",
      sms_payment_enabled: true
    },
    create: {
      id: 'default',
      site_name: "엘프알바",
      contact_phone: "010-9946-2445",
      bank_name: "국민은행",
      bank_account: "219401-04-263185",
      bank_owner: "(주)세컨즈나인",
      footer_company_name: "(주)세컨즈나인",
      footer_address: "서울특별시 강남구",
      footer_business_num: "123-45-67890",
      footer_report_num: "2024-서울강남-0000",
      sms_expiry_2d_text: "♥엘프알바♥대표님의 광고가 2일 남으셨어요^.^연장 신청바랍니다 elfalba.com",
      sms_expiry_2d_enabled: true,
      sms_expiry_1d_text: "♥엘프알바♥대표님의 광고가 내일 마감되세요^.^연장 신청바랍니다 elfalba.com",
      sms_expiry_1d_enabled: true,
      sms_expired_1d_text: "♥엘프알바♥대표님의 광고가 마감되었어요^.^연장 신청바랍니다 elfalba.com",
      sms_expired_1d_enabled: true,
      sms_payment_text: "[엘프알바] {금액}원 입금 부탁드립니다. {은행} {계좌} 예금주:{예금주}",
      sms_payment_enabled: true
    }
  });

  console.log('Default SMS settings applied successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
